'use client';

interface ShareButtonsProps {
  pageUrl: string;
}

/**
 * Social share buttons for the success page
 * Client component to handle onClick events
 */
export function ShareButtons({ pageUrl }: ShareButtonsProps) {
  const handleShare = async () => {
    const fullUrl = `https://${pageUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out my page!',
          url: fullUrl,
        });
      } catch {
        // User cancelled or share failed
        navigator.clipboard.writeText(fullUrl);
      }
    } else {
      navigator.clipboard.writeText(fullUrl);
    }
  };

  return (
    <div className="flex justify-center gap-4">
      <a
        href={`https://twitter.com/intent/tweet?text=Just%20launched%20my%20page%20on%20@celebio%21%20Check%20it%20out%3A%20https%3A%2F%2F${pageUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
      <button
        onClick={handleShare}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      </button>
    </div>
  );
}
