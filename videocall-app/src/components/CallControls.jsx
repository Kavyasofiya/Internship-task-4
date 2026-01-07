import React from 'react';
import './CallControls.css';

const CallControls = ({
  callStatus,
  callType,
  onStartCall,
  onEndCall,
  onToggleVideo,
  onToggleAudio,
  onToggleCallType
}) => {
  const isCalling = callStatus === 'calling' || callStatus === 'in-progress';
  const isIdle = callStatus === 'idle';

  return (
    <div className="call-controls">
      {isIdle ? (
        <button 
          className="call-btn start-call"
          onClick={onStartCall}
          title={`Start ${callType} call`}
        >
          <span className="btn-icon">📞</span>
          <span className="btn-text">
            {callType === 'video' ? 'Start Video Call' : 'Start Voice Call'}
          </span>
        </button>
      ) : (
        <div className="controls-group">
          {callStatus === 'in-progress' && (
            <>
              <button 
                className="control-btn toggle-video"
                onClick={onToggleVideo}
                title="Toggle video"
              >
                <span className="btn-icon">📹</span>
                <span className="btn-text">Video</span>
              </button>
              
              <button 
                className="control-btn toggle-audio"
                onClick={onToggleAudio}
                title="Toggle audio"
              >
                <span className="btn-icon">🎤</span>
                <span className="btn-text">Audio</span>
              </button>
              
              <button 
                className="control-btn toggle-type"
                onClick={onToggleCallType}
                title="Switch call type"
              >
                <span className="btn-icon">🔄</span>
                <span className="btn-text">
                  {callType === 'video' ? 'Switch to Audio' : 'Switch to Video'}
                </span>
              </button>
            </>
          )}
          
          <button 
            className="call-btn end-call"
            onClick={onEndCall}
            title="End call"
          >
            <span className="btn-icon">📴</span>
            <span className="btn-text">End Call</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CallControls;