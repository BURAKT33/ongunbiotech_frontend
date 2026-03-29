import { Download, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  markdown: string;
  fileName: string;
  subtitle?: string;
  /** Firebase Storage indirme bağlantısı (yalnızca dosya sahibi için) */
  firebaseStorageUrl?: string;
};

export function ReportMarkdownDocument({
  markdown,
  fileName,
  subtitle,
  firebaseStorageUrl,
}: Props) {
  const download = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.rel = 'noopener';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-start gap-3 min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate" title={fileName}>
              {fileName}
            </p>
            {subtitle ? <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p> : null}
            <p className="text-xs text-gray-500 mt-1">
              {firebaseStorageUrl
                ? 'Dosya Firebase Storage’da kayıtlı; yerel kopya da indirilebilir.'
                : 'Markdown rapor · İndirip arşivleyebilirsiniz'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {firebaseStorageUrl ? (
            <a
              href={firebaseStorageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-sky-200 bg-sky-50 text-sky-900 text-sm font-medium hover:bg-sky-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              Storage .md
            </a>
          ) : null}
          <button
            type="button"
            onClick={download}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 text-sm font-medium hover:bg-emerald-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            .md indir
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white px-4 py-5 max-h-[min(70vh,560px)] overflow-y-auto">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-xl font-bold text-gray-900 mt-2 mb-3 pb-2 border-b border-gray-100">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-semibold text-gray-900 mt-5 mb-2">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">{children}</h3>
            ),
            p: ({ children }) => <p className="text-sm text-gray-800 leading-relaxed mb-3">{children}</p>,
            ul: ({ children }) => (
              <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1.5 mb-3">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-5 text-sm text-gray-800 space-y-1.5 mb-3">{children}</ol>
            ),
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
            hr: () => <hr className="my-6 border-gray-200" />,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-emerald-200 pl-3 my-3 text-sm text-gray-700 italic">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-4 rounded-lg border border-gray-200">
                <table className="min-w-full text-xs sm:text-sm border-collapse text-gray-800">{children}</table>
              </div>
            ),
            thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
            th: ({ children }) => (
              <th className="border border-gray-200 px-2 py-2 text-left font-semibold text-gray-900 whitespace-nowrap">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-gray-200 px-2 py-2 align-top text-gray-800">{children}</td>
            ),
            code: ({ className, children }) => {
              const inline = !className;
              if (inline) {
                return (
                  <code className="px-1 py-0.5 rounded bg-gray-100 text-gray-900 text-[0.8rem] font-mono">
                    {children}
                  </code>
                );
              }
              return (
                <code className="block text-xs font-mono bg-gray-50 p-3 rounded-lg overflow-x-auto my-2">
                  {children}
                </code>
              );
            },
            pre: ({ children }) => <pre className="my-2 overflow-x-auto">{children}</pre>,
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}
