
import React from 'react';

const iconProps = {
  className: "w-6 h-6",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const InventoryIcon = () => (
  <svg {...iconProps}><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
);
export const CheckoutIcon = () => (
  <svg {...iconProps}><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
);
export const DashboardIcon = () => (
  <svg {...iconProps}><path d="M3 3v18h18"></path><path d="M18.7 8a6 6 0 0 0-8.4 0L7 11.3"></path><path d="M12 17.3a6 6 0 0 0 8.4 0L23 14"></path></svg>
);
export const AssistantIcon = () => (
    <svg {...iconProps}><path d="M12 8V4H8"></path><rect x="4" y="12" width="8" height="8" rx="2"></rect><path d="M8 12v1"></path><path d="M12 12v1"></path><path d="M12 18H8"></path><path d="M16 12v8"></path><path d="M20 12v8"></path></svg>
);
export const ClientsIcon = () => (
    <svg {...iconProps}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);
export const SettingsIcon = () => (
    <svg {...iconProps}><path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.58-.21l-2.49 1a6.38 6.38 0 0 0-2.99-1.7V2.5A.5.5 0 0 0 13.5 2h-3a.5.5 0 0 0-.5.5v2.09A6.38 6.38 0 0 0 7.01 6.3l-2.49-1a.5.5 0 0 0-.58.21l-1.92 3.32a.49.49 0 0 0 .12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32a.49.49 0 0 0 .58.21l2.49-1a6.38 6.38 0 0 0 2.99 1.7V21.5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-2.09a6.38 6.38 0 0 0 2.99-1.7l2.49 1a.5.5 0 0 0 .58-.21l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);
// FIX: Add and export the missing VideoIcon component.
export const VideoIcon = ({ className = "mx-auto h-12 w-12" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
);
export const MicIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>
);
export const StopIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12"></rect></svg>
);
export const PhotoIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
);
export const TextIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
);
export const Spinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);