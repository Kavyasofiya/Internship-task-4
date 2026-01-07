import React, { useState, useRef, useEffect } from 'react';

const CallPage = ({ user }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState('idle');
  const [callType, setCallType] = useState('video');
  const [recipientId, setRecipientId] = useState('user-123');
  const [callDuration, setCallDuration] = useState(0);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [callLogs, setCallLogs] = useState([]);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const localStreamRef = useRef(null);

  // Initialize video elements
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });
      
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      alert('Could not access camera/microphone. Please check permissions.');
      return null;
    }
  };

  const startCall = async () => {
    if (!recipientId.trim()) {
      alert('Please enter a recipient ID');
      return;
    }

    try {
      setCallStatus('calling');
      
      const stream = await initializeMedia();
      if (!stream) {
        setCallStatus('idle');
        return;
      }

      // Simulate calling process
      setTimeout(() => {
        setCallStatus('in-call');
        
        // Start timer
        const startTime = Date.now();
        durationIntervalRef.current = setInterval(() => {
          setCallDuration(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        // Create mock remote stream
        if (callType === 'video') {
          // Create a fake video stream
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d');
          
          // Draw gradient background
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, '#667eea');
          gradient.addColorStop(1, '#764ba2');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw text
          ctx.fillStyle = 'white';
          ctx.font = '30px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(recipientId, canvas.width/2, canvas.height/2);
          
          const fakeStream = canvas.captureStream(30);
          setRemoteStream(fakeStream);
        } else {
          // For audio calls, just set null
          setRemoteStream(null);
        }

        // Add call log
        const newLog = {
          id: Date.now(),
          type: callType,
          participants: [user.uid, recipientId],
          duration: 0,
          timestamp: new Date().toISOString()
        };
        setCallLogs(prev => [newLog, ...prev]);
        
        // Save to localStorage
        const saved = JSON.parse(localStorage.getItem('callLogs') || '[]');
        localStorage.setItem('callLogs', JSON.stringify([newLog, ...saved]));

      }, 1500);

    } catch (error) {
      alert('Failed to start call: ' + error.message);
      setCallStatus('idle');
    }
  };

  const endCall = () => {
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
    }
    
    setCallStatus('ended');
    setLocalStream(null);
    setRemoteStream(null);
    
    setTimeout(() => {
      setCallStatus('idle');
      setCallDuration(0);
    }, 1000);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsVideoEnabled(track.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsAudioEnabled(track.enabled);
      }
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Styles object
  const styles = {
    page: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#000'
    },
    videoContainer: {
      flex: 1,
      position: 'relative',
      background: '#1a1a1a'
    },
    remoteVideo: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      background: '#000'
    },
    localVideo: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 160,
      height: 120,
      border: '2px solid white',
      borderRadius: 8,
      overflow: 'hidden',
      background: '#000'
    },
    videoElement: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    localLabel: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(0,0,0,0.7)',
      color: 'white',
      fontSize: 12,
      padding: '4px',
      textAlign: 'center'
    },
    remotePlaceholder: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: 'white'
    },
    placeholderAvatar: {
      width: 100,
      height: 100,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 36,
      marginBottom: 20
    },
    controlsPanel: {
      background: 'white',
      padding: 20,
      borderTop: '1px solid #e5e7eb'
    },
    callInfo: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 20,
      padding: 15,
      background: '#f8f9fa',
      borderRadius: 8
    },
    statusBadge: {
      padding: '6px 12px',
      borderRadius: 20,
      fontSize: 14,
      fontWeight: 500
    },
    duration: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 16,
      fontWeight: 600
    },
    callTypeBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 14,
      color: '#4b5563'
    },
    controls: {
      display: 'flex',
      justifyContent: 'center',
      gap: 10,
      marginBottom: 20
    },
    startCallBtn: {
      background: '#10b981',
      color: 'white',
      border: 'none',
      padding: '14px 28px',
      borderRadius: 8,
      fontSize: 16,
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    },
    endCallBtn: {
      background: '#ef4444',
      color: 'white',
      border: 'none',
      padding: '14px 28px',
      borderRadius: 8,
      fontSize: 16,
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    },
    mediaBtn: {
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: 6,
      cursor: 'pointer',
      fontSize: 14,
      display: 'flex',
      alignItems: 'center',
      gap: 6
    },
    inputSection: {
      display: 'flex',
      gap: 10,
      marginBottom: 20
    },
    recipientInput: {
      flex: 1,
      padding: 12,
      border: '1px solid #d1d5db',
      borderRadius: 6,
      fontSize: 14
    },
    typeSelect: {
      padding: 12,
      border: '1px solid #d1d5db',
      borderRadius: 6,
      fontSize: 14,
      background: 'white',
      minWidth: 120
    },
    userInfo: {
      marginTop: 20,
      paddingTop: 20,
      borderTop: '1px solid #e5e7eb',
      fontSize: 14,
      color: '#6b7280'
    },
    callingStatus: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginTop: 10
    },
    spinner: {
      width: 20,
      height: 20,
      border: '2px solid #f3f3f3',
      borderTop: '2px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }
  };

  // Dynamic status badge styles
  const getStatusBadgeStyle = () => {
    let background, color;
    
    switch(callStatus) {
      case 'in-call':
        background = '#d1fae5';
        color = '#065f46';
        break;
      case 'calling':
        background = '#fef3c7';
        color = '#92400e';
        break;
      case 'ended':
        background = '#fee2e2';
        color = '#991b1b';
        break;
      default:
        background = '#e5e7eb';
        color = '#374151';
    }
    
    return {
      ...styles.statusBadge,
      background,
      color
    };
  };

  // Media button styles
  const getMediaBtnStyle = (isActive) => ({
    ...styles.mediaBtn,
    background: isActive ? '#3b82f6' : '#6b7280'
  });

  return (
    <div style={styles.page}>
      {/* Video Container */}
      <div style={styles.videoContainer}>
        {/* Remote Video */}
        <div style={{ width: '100%', height: '100%' }}>
          {remoteStream ? (
            <video 
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={styles.remoteVideo}
            />
          ) : (
            <div style={styles.remotePlaceholder}>
              <div style={styles.placeholderAvatar}>
                {recipientId ? recipientId.charAt(0).toUpperCase() : '?'}
              </div>
              <h3>{recipientId || 'No recipient'}</h3>
              {callStatus === 'calling' && (
                <div style={styles.callingStatus}>
                  <div style={styles.spinner}></div>
                  <p>Calling {recipientId}...</p>
                </div>
              )}
              {callStatus === 'in-call' && (
                <p style={{ color: '#10b981', marginTop: 10 }}>Connected</p>
              )}
            </div>
          )}
        </div>

        {/* Local Video */}
        <div style={styles.localVideo}>
          <video 
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={styles.videoElement}
          />
          <div style={styles.localLabel}>
            {isVideoEnabled ? '🔴 Live' : '⏸️ Video Off'}
          </div>
        </div>
      </div>

      {/* Controls Panel */}
      <div style={styles.controlsPanel}>
        {/* Call Info */}
        <div style={styles.callInfo}>
          <div style={getStatusBadgeStyle()}>
            {callStatus === 'idle' && 'Ready to Call'}
            {callStatus === 'calling' && 'Calling...'}
            {callStatus === 'in-call' && 'In Call'}
            {callStatus === 'ended' && 'Call Ended'}
          </div>
          <div style={styles.duration}>
            ⏱️ {formatDuration(callDuration)}
          </div>
          <div style={styles.callTypeBadge}>
            {callType === 'video' ? '📹' : '📞'} 
            {callType === 'video' ? 'Video Call' : 'Voice Call'}
          </div>
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          {callStatus === 'idle' ? (
            <button 
              style={styles.startCallBtn}
              onClick={startCall}
            >
              📞 Start {callType === 'video' ? 'Video' : 'Voice'} Call
            </button>
          ) : (
            <>
              {callStatus === 'in-call' && (
                <>
                  <button 
                    style={getMediaBtnStyle(isVideoEnabled)}
                    onClick={toggleVideo}
                  >
                    {isVideoEnabled ? '🎥' : '📵'} Video
                  </button>
                  <button 
                    style={getMediaBtnStyle(isAudioEnabled)}
                    onClick={toggleAudio}
                  >
                    {isAudioEnabled ? '🎤' : '🔇'} Audio
                  </button>
                </>
              )}
              <button 
                style={styles.endCallBtn}
                onClick={endCall}
              >
                📴 End Call
              </button>
            </>
          )}
        </div>

        {/* Input Section */}
        <div style={styles.inputSection}>
          <input
            type="text"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            placeholder="Enter recipient ID"
            disabled={callStatus !== 'idle'}
            style={styles.recipientInput}
          />
          <select 
            value={callType}
            onChange={(e) => setCallType(e.target.value)}
            disabled={callStatus !== 'idle'}
            style={styles.typeSelect}
          >
            <option value="video">Video Call</option>
            <option value="audio">Voice Call</option>
          </select>
        </div>

        {/* User Info */}
        <div style={styles.userInfo}>
          <p><strong>Your ID:</strong> {user.uid}</p>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 5 }}>
            Share your ID with others. Try: user-123, user-456, user-789
          </p>
          
          {/* Recent Calls */}
          {callLogs.length > 0 && (
            <div style={{ marginTop: 15, paddingTop: 15, borderTop: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Recent calls:</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {callLogs.slice(0, 3).map(log => (
                  <div key={log.id} style={{
                    padding: '6px 12px',
                    background: '#f3f4f6',
                    borderRadius: 6,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span>{log.type === 'video' ? '📹' : '📞'}</span>
                    <span>{log.participants[1]}</span>
                    <span style={{ color: '#6b7280' }}>
                      {formatDuration(log.duration)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add spin animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CallPage;