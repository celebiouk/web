type RichTextContentProps = {
  html: string;
  className?: string;
};

export function RichTextContent({ html, className = '' }: RichTextContentProps) {
  return (
    <div
      className={`prose max-w-none text-gray-700 dark:prose-invert dark:text-gray-300 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
