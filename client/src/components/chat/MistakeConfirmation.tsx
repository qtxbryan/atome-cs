interface Props {
  onContinue: () => void;
}

export default function MistakeConfirmation({ onContinue }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="text-center px-6">
        <div className="mb-6 flex justify-center">
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="32" cy="32" r="32" fill="#F4FF5F" />
            <path
              d="M18 32L27 42L46 22"
              stroke="#000"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Thanks for your feedback!
        </h2>
        <p className="text-zinc-400 mb-8 max-w-xs mx-auto">
          Your report has been submitted. Our team will review it and improve
          the bot's responses.
        </p>
        <button
          onClick={onContinue}
          className="bg-atome text-black font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity"
        >
          Continue Chatting
        </button>
      </div>
    </div>
  );
}
