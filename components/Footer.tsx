
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-6 px-6 md:px-12 border-t border-slate-200 bg-white text-slate-700 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
      <span>© 2026 VM Gestão Estratégica. Todos os direitos reservados.</span>
      <div className="flex items-center gap-1">
        <span>Desenvolvido por</span>
        <a 
          href="https://topstack.com.br?utm_source=vm_gestao_social_media&utm_medium=software_branding&utm_campaign=dev_by_topstack" 
          target="_blank" 
          rel="noopener noreferrer"
          className="font-bold text-slate-900 hover:text-[#4c6eb3] transition-colors flex items-center gap-1 group"
        >
          TOPSTACK
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
          >
            <path d="M7 7h10v10"/><path d="M7 17 17 7"/>
          </svg>
        </a>
      </div>
    </footer>
  );
};

export default Footer;
