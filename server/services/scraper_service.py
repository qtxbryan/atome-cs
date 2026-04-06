import asyncio
from urllib.parse import urlparse

import requests
from fastapi import HTTPException
from markdownify import markdownify as md


def _parse_base_and_locale(url: str) -> tuple[str, str]:
    """
    Extract base URL and locale from a Zendesk Help Center URL.
    e.g. https://help.atome.ph/hc/en-gb/categories/123
      -> ("https://help.atome.ph", "en-gb")
    """
    parsed = urlparse(url)
    base_url = f"{parsed.scheme}://{parsed.netloc}"

    # Path looks like /hc/<locale>/...
    parts = parsed.path.strip("/").split("/")
    try:
        hc_idx = parts.index("hc")
        locale = parts[hc_idx + 1]
    except (ValueError, IndexError):
        raise ValueError(
            "Unsupported URL. Must be a Zendesk Help Center URL containing /hc/<locale>/."
        )

    return base_url, locale


def _get_categories(base_url: str, locale: str) -> list[dict]:
    url = f"{base_url}/api/v2/help_center/{locale}/categories.json"
    res = requests.get(url, timeout=30)
    res.raise_for_status()
    return res.json()["categories"]


def _get_sections(base_url: str, locale: str, category_id: int) -> list[dict]:
    url = f"{base_url}/api/v2/help_center/{locale}/categories/{category_id}/sections.json"
    res = requests.get(url, timeout=30)
    res.raise_for_status()
    return res.json()["sections"]


def _get_articles(base_url: str, locale: str, section_id: int) -> list[dict]:
    articles: list[dict] = []
    url: str | None = (
        f"{base_url}/api/v2/help_center/{locale}/sections/{section_id}/articles.json"
    )
    while url:
        res = requests.get(url, timeout=30)
        res.raise_for_status()
        data = res.json()
        articles.extend(data["articles"])
        url = data.get("next_page")
    return articles


def _scrape_sync(url: str) -> tuple[str, int]:
    base_url, locale = _parse_base_and_locale(url)

    categories = _get_categories(base_url, locale)
    sections_map: list[tuple[dict, dict]] = []

    for category in categories:
        sections = _get_sections(base_url, locale, category["id"])
        for section in sections:
            sections_map.append((category, section))

    article_chunks: list[str] = []

    for category, section in sections_map:
        articles = _get_articles(base_url, locale, section["id"])
        for article in articles:
            body_md = md(article.get("body") or "")
            chunk = (
                f"# {article['title']}\n\n"
                f"**Category:** {category['name']}  \n"
                f"**Section:** {section['name']}  \n"
                f"**URL:** {article['html_url']}  \n"
                f"**Last Updated:** {article['updated_at']}\n\n"
                "---\n\n"
                f"{body_md}"
            )
            article_chunks.append(chunk)

    combined = "\n\n---\n\n".join(article_chunks)
    return combined, len(article_chunks)


async def scrape(url: str) -> tuple[str, int]:
    """
    Async wrapper around the synchronous Zendesk API scraper.
    Returns (combined_markdown, article_count).
    Raises HTTPException(400) for unsupported URLs.
    Raises HTTPException(502) for network/API failures.
    """
    try:
        _parse_base_and_locale(url)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    try:
        return await asyncio.to_thread(_scrape_sync, url)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to scrape knowledge base: {exc}",
        )
