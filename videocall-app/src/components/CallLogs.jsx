import React, { useState, useEffect } from 'react';

const CallLogs = ({ user }) => {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const savedLogs = JSON.parse(localStorage.getItem('callLogs') || '[]');
    
    // Add sample logs if none exist
    if (savedLogs.length === 0) {
      const sampleLogs = [
        {
          id: 1,
          type: 'video',
          participants: [user.uid, 'user-123'],
          callerId: user.uid,
          status: 'completed',
          duration: 300,
          timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        },
        {
          id: 2,
          type: 'audio',
          participants: [user.uid, 'user-456'],
          callerId: 'user-456',
          status: 'completed',
          duration: 600,
          timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        },
        {
          id: 3,
          type: 'video',
          participants: [user.uid, 'user-789'],
          callerId: 'user-789',
          status: 'missed',
          duration: 0,
          timestamp: new Date(Date.now() - 172800000).toISOString() // 2 days ago
        }
      ];
      setLogs(sampleLogs);
      localStorage.setItem('callLogs', JSON.stringify(sampleLogs));
    } else {
      setLogs(savedLogs);
    }
  }, [user.uid]);

  const filteredLogs = logs.filter(log => {
    if (filter === 'missed' && log.status !== 'missed') return false;
    if (filter === 'incoming' && log.callerId === user.uid) return false;
    if (filter === 'outgoing' && log.callerId !== user.uid) return false;
    if (searchTerm && !log.participants.some(p => 
      p.toLowerCase().includes(searchTerm.toLowerCase())
    )) return false;
    return true;
  });

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#10b981';
      case 'missed': return '#ef4444';
      case 'rejected': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const styles = {
    container: {
      padding: 20,
      maxWidth: 1200,
      margin: '0 auto',
      width: '100%'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20
    },
    title: {
      fontSize: 24,
      color: '#1f2937',
      margin: 0
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: 15,
      marginBottom: 25
    },
    statCard: {
      background: 'white',
      padding: 20,
      borderRadius: 10,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      textAlign: 'center'
    },
    statValue: {
      fontSize: 28,
      fontWeight: 700,
      marginBottom: 5
    },
    statLabel: {
      fontSize: 14,
      color: '#6b7280'
    },
    filters: {
      background: 'white',
      padding: 20,
      borderRadius: 10,
      marginBottom: 20,
      display: 'flex',
      flexWrap: 'wrap',
      gap: 15,
      alignItems: 'center'
    },
    filterButtons: {
      display: 'flex',
      gap: 10
    },
    filterBtn: (active) => ({
      padding: '8px 16px',
      background: active ? '#3b82f6' : '#f3f4f6',
      color: active ? 'white' : '#374151',
      border: 'none',
      borderRadius: 6,
      cursor: 'pointer',
      fontSize: 13
    }),
    searchInput: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: 6,
      fontSize: 14,
      minWidth: 200
    },
    logsContainer: {
      background: 'white',
      borderRadius: 10,
      padding: 20,
      minHeight: 400
    },
    logItem: {
      padding: 16,
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 15
    },
    logIcon: {
      fontSize: 24,
      padding: 12,
      background: '#f3f4f6',
      borderRadius: 8
    },
    logContent: {
      flex: 1
    },
    logHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 8
    },
    logType: {
      fontWeight: 600,
      fontSize: 14
    },
    logTime: {
      color: '#6b7280',
      fontSize: 12
    },
    logParticipants: {
      fontSize: 14,
      color: '#4b5563',
      marginBottom: 8
    },
    logDetails: {
      display: 'flex',
      gap: 12,
      fontSize: 12,
      color: '#6b7280'
    },
    statusBadge: (color) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '4px 8px',
      background: color + '20',
      color: color,
      borderRadius: 4,
      fontWeight: 500
    }),
    noLogs: {
      textAlign: 'center',
      padding: 60,
      color: '#6b7280'
    }
  };

  const stats = {
    total: logs.length,
    missed: logs.filter(l => l.status === 'missed').length,
    incoming: logs.filter(l => l.callerId !== user.uid).length,
    outgoing: logs.filter(l => l.callerId === user.uid).length,
    video: logs.filter(l => l.type === 'video').length,
    audio: logs.filter(l => l.type === 'audio').length
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>📋 Call History</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search calls..."
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.total}</div>
          <div style={styles.statLabel}>Total Calls</div>
        </div>
        <div style={{...styles.statCard, borderTop: '4px solid #ef4444'}}>
          <div style={{...styles.statValue, color: '#ef4444'}}>{stats.missed}</div>
          <div style={styles.statLabel}>Missed</div>
        </div>
        <div style={{...styles.statCard, borderTop: '4px solid #3b82f6'}}>
          <div style={{...styles.statValue, color: '#3b82f6'}}>{stats.incoming}</div>
          <div style={styles.statLabel}>Incoming</div>
        </div>
        <div style={{...styles.statCard, borderTop: '4px solid #10b981'}}>
          <div style={{...styles.statValue, color: '#10b981'}}>{stats.outgoing}</div>
          <div style={styles.statLabel}>Outgoing</div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.filterButtons}>
          <button 
            style={styles.filterBtn(filter === 'all')}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            style={styles.filterBtn(filter === 'missed')}
            onClick={() => setFilter('missed')}
          >
            Missed
          </button>
          <button 
            style={styles.filterBtn(filter === 'incoming')}
            onClick={() => setFilter('incoming')}
          >
            Incoming
          </button>
          <button 
            style={styles.filterBtn(filter === 'outgoing')}
            onClick={() => setFilter('outgoing')}
          >
            Outgoing
          </button>
        </div>
      </div>

      {/* Logs List */}
      <div style={styles.logsContainer}>
        {filteredLogs.length === 0 ? (
          <div style={styles.noLogs}>
            <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.5 }}>📭</div>
            <p>No call logs found</p>
            <p style={{ fontSize: 14, color: '#9ca3af', marginTop: 8 }}>
              {logs.length === 0 ? 'Make your first call!' : 'Try changing your filters'}
            </p>
          </div>
        ) : (
          <div>
            <div style={{ 
              fontSize: 14, 
              color: '#6b7280', 
              marginBottom: 16, 
              paddingBottom: 16, 
              borderBottom: '1px solid #e5e7eb' 
            }}>
              Showing {filteredLogs.length} of {logs.length} calls
            </div>
            
            {filteredLogs.map(log => {
              const isOutgoing = log.callerId === user.uid;
              const statusColor = getStatusColor(log.status);
              
              return (
                <div key={log.id} style={{
                  ...styles.logItem,
                  borderLeft: `4px solid ${statusColor}`
                }}>
                  <div style={styles.logIcon}>
                    {log.type === 'video' ? '📹' : '📞'}
                  </div>
                  
                  <div style={styles.logContent}>
                    <div style={styles.logHeader}>
                      <div style={styles.logType}>
                        {isOutgoing ? (
                          <span style={{ color: '#10b981' }}>Outgoing →</span>
                        ) : (
                          <span style={{ color: '#3b82f6' }}>← Incoming</span>
                        )}
                      </div>
                      <div style={styles.logTime}>{formatDate(log.timestamp)}</div>
                    </div>
                    
                    <div style={styles.logParticipants}>
                      <strong>With:</strong> {log.participants.filter(p => p !== user.uid).join(', ')}
                    </div>
                    
                    <div style={styles.logDetails}>
                      <div style={styles.statusBadge(statusColor)}>
                        {log.status === 'completed' ? '✅ Completed' :
                         log.status === 'missed' ? '❌ Missed' :
                         log.status === 'rejected' ? '↪️ Rejected' : log.status}
                      </div>
                      
                      {log.duration > 0 && (
                        <div>
                          <strong>Duration:</strong> {formatDuration(log.duration)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallLogs;