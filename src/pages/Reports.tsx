import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import { ShineBorder } from '../components/ui/shine-border';

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
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-ink tracking-tight">Reports & Analytics</h1>
        <p className="text-ink-muted text-sm mt-2 max-w-2xl">
          Generate comprehensive reports of all tasks, their statuses, priorities, and assigned employees. 
          Export your data for deeper analysis in external tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        {/* CSV Export Card */}
        <div className="relative surface-1 rounded-xl p-8 flex flex-col items-start overflow-hidden shadow-2xl group hover:-translate-y-1 transition-all duration-300">
          <ShineBorder shineColor={["#5e6ad2", "#828fff", "#5e69d1"]} borderWidth={1.5} />
          
          <div className="relative z-10 w-full flex flex-col h-full">
            <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-surface-3 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
              <FileText className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-ink mb-2">CSV Export</h3>
            <p className="text-ink-muted text-sm mb-8 flex-1">
              Download a raw, comma-separated values file. Best for importing into custom databases, legacy systems, or simple scripts.
            </p>
            <ul className="space-y-3 mb-8 text-sm text-ink-subtle">
              <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-success" /> Lightweight & fast</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-success" /> Universal compatibility</li>
            </ul>
            
            <button
              onClick={() => handleExport('csv')}
              disabled={loadingType !== null}
              className="btn-secondary w-full py-3 justify-center group/btn mt-auto"
            >
              <Download className="w-4 h-4 mr-2 group-hover/btn:-translate-y-0.5 transition-transform" />
              {loadingType === 'csv' ? 'Generating...' : 'Download CSV'}
            </button>
          </div>
        </div>

        {/* Excel Export Card */}
        <div className="relative surface-1 rounded-xl p-8 flex flex-col items-start overflow-hidden shadow-2xl group hover:-translate-y-1 transition-all duration-300">
          <ShineBorder shineColor={["#27a644", "#34c759", "#28a745"]} borderWidth={1.5} />
          
          <div className="relative z-10 w-full flex flex-col h-full">
            <div className="w-14 h-14 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
              <FileSpreadsheet className="w-7 h-7 text-success" />
            </div>
            <h3 className="text-xl font-semibold text-ink mb-2">Excel Report</h3>
            <p className="text-ink-muted text-sm mb-8 flex-1">
              Generate a formatted Microsoft Excel spreadsheet. Ideal for sharing with stakeholders and creating immediate pivot tables or charts.
            </p>
            <ul className="space-y-3 mb-8 text-sm text-ink-subtle">
              <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-success" /> Formatted columns</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-success" /> Ready for presentation</li>
            </ul>
            
            <button
              onClick={() => handleExport('excel')}
              disabled={loadingType !== null}
              className="btn-primary w-full py-3 justify-center bg-success hover:bg-success/90 text-white group/btn border-transparent mt-auto"
            >
              <Download className="w-4 h-4 mr-2 group-hover/btn:-translate-y-0.5 transition-transform" />
              {loadingType === 'excel' ? 'Generating...' : 'Download Excel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
