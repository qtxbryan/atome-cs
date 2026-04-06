from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup
from fastapi import HTTPException
from playwright.async_api import async_playwright

MAX_CONTENT_CHARS = 50_000


def validate_and_detect_kb_type(url: str) -> None:
    """
    Only Zendesk Help Center category or section URLs are supported.
    Raises ValueError with a user-facing message if the URL is unsupported.
    """
    if "/hc/" not in url or (
        "/categories/" not in url and "/sections/" not in url
    ):
        raise ValueError(
            "Unsupported URL. Only Zendesk Help Center category or section URLs are "
            "supported (must contain /hc/ and /categories/ or /sections/)."
        )


def _extract_article_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup.find_all(["script", "style", "nav", "header", "footer"]):
        tag.decompose()

    container = (
        soup.find("article")
        or soup.find("main")
        or soup.find("body")
    )
    if not container:
        return ""

    text = container.get_text(separator="\n", strip=True)
    # Collapse runs of blank lines down to one
    lines = [line for line in text.splitlines() if line.strip()]
    return "\n".join(lines)


def _discover_article_links(html: str, base_origin: str, root_netloc: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    seen: set[str] = set()
    links: list[str] = []

    for a in soup.find_all("a", href=True):
        full = urljoin(base_origin, a["href"])
        parsed = urlparse(full)
        if parsed.netloc != root_netloc or "/articles/" not in parsed.path:
            continue
        clean = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
        if clean not in seen:
            seen.add(clean)
            links.append(clean)

    return links


async def _fetch_article_text(context, article_url: str) -> str:
    try:
        page = await context.new_page()
        await page.goto(article_url, wait_until="networkidle", timeout=20_000)
        html = await page.content()
        await page.close()
        return _extract_article_text(html)
    except Exception:
        return ""


async def crawl_knowledge_base(url: str) -> tuple[str, int]:
    """
    Crawl a Zendesk Help Center category/section page using a headless browser,
    discover all article links, extract clean text from each article, and return
    the combined content along with the article count.

    Returns (content: str, article_count: int).
    Raises HTTPException(400) for unsupported URLs.
    Raises HTTPException(502) for network/browser failures.
    """
    try:
        validate_and_detect_kb_type(url)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    parsed_root = urlparse(url)
    base_origin = f"{parsed_root.scheme}://{parsed_root.netloc}"

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                )
            )

            page = await context.new_page()
            await page.goto(url, wait_until="networkidle", timeout=30_000)
            html = await page.content()

            article_links = _discover_article_links(html, base_origin, parsed_root.netloc)

            article_texts: list[str] = []
            for article_url in article_links:
                text = await _fetch_article_text(context, article_url)
                if text:
                    article_texts.append(text)

            await browser.close()

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to crawl the knowledge base: {exc}",
        )

    combined = "\n\n---\n\n".join(article_texts)
    if len(combined) > MAX_CONTENT_CHARS:
        combined = combined[:MAX_CONTENT_CHARS] + "\n\n[Content truncated]"

    return combined, len(article_texts)
