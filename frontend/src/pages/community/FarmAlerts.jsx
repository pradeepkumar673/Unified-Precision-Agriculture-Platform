import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAlerts } from '../../api/communityApi';

export default function FarmAlerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [expandedAlerts, setExpandedAlerts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const farmId = localStorage.getItem('farmId') || '00000000-0000-0000-0000-000000000000';
        const data = await getAlerts(farmId);
        setAlerts(data);
        
        // Auto-expand the first critical alert if any exist
        if (data && data.length > 0) {
          const firstCritical = data.findIndex(a => (a.severity || '').toLowerCase() === 'critical');
          if (firstCritical !== -1) {
            setExpandedAlerts({ [data[firstCritical].id]: true });
          }
        }
      } catch (error) {
        console.error('Failed to load alerts', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const toggleAlert = (id) => {
    setExpandedAlerts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const timeAgo = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.round((now - d) / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${Math.round(diffHours / 24)} days ago`;
  };

  const getAlertStyle = (type, severity) => {
    const t = (type || '').toLowerCase();
    const s = (severity || '').toLowerCase();
    
    if (s === 'critical' || t === 'pest') {
      return {
        strip: 'bg-error',
        badgeBg: 'bg-error-container',
        badgeText: 'text-on-error-container',
        badgeIcon: 'crisis_alert',
        badgeLabel: 'CRITICAL • Immediate Action',
        iconBg: 'bg-error-container/50',
        iconColor: 'text-error',
        icon: 'pest_control',
        categoryLabel: 'Pest Alert',
        actionBtnClass: 'bg-secondary-container text-on-secondary'
      };
    }
    if (t === 'weather') {
      return {
        strip: 'bg-secondary-container',
        badgeBg: 'bg-secondary-fixed',
        badgeText: 'text-on-secondary-fixed',
        badgeIcon: 'wb_sunny',
        badgeLabel: 'HIGH • In 24 Hours',
        iconBg: 'bg-secondary-fixed/50',
        iconColor: 'text-secondary',
        icon: 'water_drop',
        categoryLabel: 'Weather & Irrigation',
        actionBtnClass: 'bg-surface-container-high text-primary'
      };
    }
    if (t === 'market') {
      return {
        strip: 'bg-primary-container',
        badgeBg: 'bg-primary-fixed',
        badgeText: 'text-on-primary-fixed-variant',
        badgeIcon: 'trending_up',
        badgeLabel: 'POSITIVE • Price Up',
        iconBg: 'bg-primary-fixed/50',
        iconColor: 'text-primary',
        icon: 'storefront',
        categoryLabel: 'Mandi Market Spike',
        actionBtnClass: 'bg-primary text-on-primary'
      };
    }
    // Default / Scheme
    return {
      strip: 'bg-tertiary',
      badgeBg: 'bg-tertiary-fixed',
      badgeText: 'text-on-tertiary-fixed-variant',
      badgeIcon: 'calendar_clock',
      badgeLabel: 'DEADLINE • Act Soon',
      iconBg: 'bg-tertiary-fixed/60',
      iconColor: 'text-tertiary',
      icon: 'account_balance',
      categoryLabel: 'Govt Subsidy / Info',
      actionBtnClass: 'bg-surface-container-high text-primary'
    };
  };

  const filteredAlerts = alerts.filter(a => {
    if (activeFilter === 'All') return true;
    const type = (a.type || '').toLowerCase();
    if (activeFilter === 'Weather' && type === 'weather') return true;
    if (activeFilter === 'Pest & Disease' && type === 'pest') return true;
    if (activeFilter === 'Market' && type === 'market') return true;
    if (activeFilter === 'Scheme & Subsidies' && type === 'scheme') return true;
    return false;
  });

  const getAlertTitle = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'pest') return 'Pest & Disease Alert';
    if (t === 'irrigation' || t === 'weather' || t === 'spray_window') return 'Weather & Irrigation';
    if (t === 'market') return 'Market Insight';
    return 'Farm Alert';
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col relative">
      

      <main className="flex flex-col w-full pt-[96px] pb-24 px-margin bg-surface flex-1 gap-space-sm">
        
        <div className="flex flex-wrap items-center justify-between pt-1 gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-[24px]">notifications_active</span>
              <span className="absolute top-0 right-0.5 w-2.5 h-2.5 bg-error rounded-full border border-surface"></span>
            </div>
            <span className="font-headline-md text-headline-md text-on-surface truncate">Recent Alerts</span>
          </div>
          <button className="text-secondary font-label-md text-label-md font-bold hover:underline py-1 flex-shrink-0 whitespace-nowrap" type="button">
            Mark all as read
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-margin px-margin hide-scrollbar">
          {['All', 'Weather', 'Pest & Disease', 'Market', 'Scheme & Subsidies'].map((filter) => (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-full font-label-md text-label-md shadow-sm transition-all flex items-center gap-1.5 ${activeFilter === filter ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`}
            >
              <span>{filter}</span>
              {activeFilter === 'All' && filter === 'All' && (
                <span className="px-1.5 py-0.5 bg-on-primary-container text-primary-container rounded-full text-label-sm font-bold leading-none">
                  {alerts.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col space-y-space-md pt-2">
          {isLoading ? (
            <div className="text-center text-on-surface-variant py-8 font-label-md">Loading alerts...</div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center text-on-surface-variant py-8 font-label-md">No alerts found.</div>
          ) : (
            filteredAlerts.map(alert => {
              const typeStr = (alert.type || '').toLowerCase();
              const style = getAlertStyle(alert.type, alert.severity);
              const isExpanded = !!expandedAlerts[alert.id];
              
              return (
                <div 
                  key={alert.id}
                  className={`relative overflow-hidden bg-surface-container-lowest rounded-xl shadow-sm pl-4 pr-space-md py-space-md flex flex-col transition-all ${!isExpanded ? 'cursor-pointer' : ''}`}
                  onClick={() => !isExpanded && toggleAlert(alert.id)}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-2.5 ${style.strip}`}></div>
                  
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2.5 py-1 rounded-full ${style.badgeBg} ${style.badgeText} font-label-sm text-label-sm font-bold flex items-center gap-1`}>
                        <span className="material-symbols-outlined text-[14px]">{style.badgeIcon}</span>
                        {style.badgeLabel}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">{style.categoryLabel}</span>
                    </div>
                    <div className={`w-10 h-10 rounded-full ${style.iconBg} flex items-center justify-center flex-shrink-0 ${style.iconColor}`}>
                      <span className="material-symbols-outlined text-[22px]">{style.icon}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface leading-snug">{getAlertTitle(alert.type)}</h2>
                      <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm mt-1">
                        <span className="material-symbols-outlined text-[15px]">schedule</span>
                        <span>{timeAgo(alert.created_at)}</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleAlert(alert.id); }}
                      className="w-10 h-10 flex items-center justify-center text-on-surface-variant transition-transform"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      <span className="material-symbols-outlined text-[24px]">expand_more</span>
                    </button>
                  </div>
                  
                  {!isExpanded && (
                    <p className="font-body-md text-body-md text-on-surface-variant mt-2 line-clamp-1">
                      {alert.message}
                    </p>
                  )}
                  
                  {isExpanded && (
                    <div className="mt-3.5 p-3 rounded-lg bg-surface-container-low flex flex-col gap-3">
                      <p className="font-body-md text-body-md text-on-surface">
                        {alert.message}
                      </p>
                      
                      <div className="flex items-center gap-2 pt-1">
                        <button 
                          className={`flex-1 min-h-[48px] px-3 font-label-md text-label-md rounded-lg flex items-center justify-center gap-1.5 shadow-sm active:opacity-90 ${style.actionBtnClass}`} 
                          type="button"
                          onClick={() => {
                            const t = (alert.type || '').toLowerCase();
                            if (t === 'pest') navigate('/health/disease-scanner');
                            else if (t === 'weather' || t === 'irrigation') navigate('/water-soil/irrigation');
                            else if (t === 'market') navigate('/marketplace/inputs');
                            else navigate('/gov/schemes');
                          }}
                        >
                          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                          <span>{alert.action_text || 'View Action'}</span>
                        </button>
                        {style.categoryLabel.includes('Pest') && (
                           <button 
                             className="min-h-[48px] px-4 bg-surface-container-high text-primary font-label-md text-label-md rounded-lg flex items-center justify-center gap-1 active:bg-surface-dim" 
                             type="button"
                             onClick={() => navigate('/community/disease-map')}
                           >
                             <span className="material-symbols-outlined text-[18px]">location_on</span>
                             <span>Map View</span>
                           </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="pt-2">
          <button className="w-full min-h-[52px] px-4 py-3 bg-surface-container rounded-xl flex items-center justify-between text-on-surface hover:bg-surface-container-high active:scale-[0.99] transition-all" type="button">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="material-symbols-outlined text-primary text-[22px]">tune</span>
              <span className="font-label-md text-label-md font-semibold truncate text-left">Manage Alert Preferences &amp; SMS Frequency</span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-[20px] flex-shrink-0">chevron_right</span>
          </button>
        </div>
      </main>

      
    </div>
  );
}
