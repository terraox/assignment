import { useState } from 'react';
import { Download } from 'lucide-react';
import api from '../utils/api';

export default function Reports() {
  const [loadingType, setLoadingType] = useState<'csv' | 'excel' | null>(null);

  const handleExport = async (format: 'csv' | 'excel') => {
    setLoadingType(format);
    try {
      const response = await api.get(`/reports?format=${format}`, {
        responseType: 'blob', // Important for downloading files
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const extension = format === 'excel' ? 'xlsx' : 'csv';
      link.setAttribute('download', `tasks_report.${extension}`);
      
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
      alert('Failed to generate report.');
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-[24px] font-semibold text-ink tracking-headline">Reports</h1>
        <p className="text-ink-muted text-sm mt-1">Export your task data to CSV or Excel formats.</p>
      </div>

      <div className="surface-1 rounded-xl border border-surface-3 p-8 max-w-2xl">
        <h3 className="text-lg font-medium text-ink mb-4">Task Export</h3>
        <p className="text-ink-muted text-sm mb-8">
          Download a complete report of tasks including their current status, priorities, dates, and assignees. 
          The exported file can be imported into other tools for further analysis.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => handleExport('csv')}
            disabled={loadingType !== null}
            className="btn-secondary flex-1 py-3 justify-center"
          >
            <Download className="w-4 h-4 mr-2" />
            {loadingType === 'csv' ? 'Generating...' : 'Export as CSV'}
          </button>
          
          <button
            onClick={() => handleExport('excel')}
            disabled={loadingType !== null}
            className="btn-primary flex-1 py-3 justify-center"
          >
            <Download className="w-4 h-4 mr-2" />
            {loadingType === 'excel' ? 'Generating...' : 'Export as Excel'}
          </button>
        </div>
      </div>
    </div>
  );
}
