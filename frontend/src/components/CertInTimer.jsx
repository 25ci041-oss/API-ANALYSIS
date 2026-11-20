import React, { useState, useEffect } from 'react';
import { Clock, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

export default function CertInTimer({ onTimerTick }) {
  const [countdown, setCountdown] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 6, minutes: 0, seconds: 0 });
  const [statusText, setStatusText] = useState('6 Hours Available');
  const [isExpired, setIsExpired] = useState(false);

  // Sync from backend
  const fetchCountdown = async () => {
    try {
      const data = await api.getCountdown();
      setCountdown(data);
      if (data.has_active_countdown && data.reporting_deadline) {
        calculateRemaining(data.reporting_deadline);
      } else {
        setStatusText(data.reporting_status || '6 Hours Available');
      }
    } catch (err) {
      console.error('Failed to sync countdown:', err);
    }
  };

  const calculateRemaining = (deadlineStr) => {
    const deadline = new Date(deadlineStr).getTime();
    const now = new Date().getTime();
    const diff = deadline - now;

    if (diff <= 0) {
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      setStatusText('Deadline Passed');
      setIsExpired(true);
    } else {
      const totalSecs = Math.floor(diff / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;

      setTimeLeft({ hours, minutes, seconds });
      setIsExpired(false);

      if (hours < 1) {
        setStatusText('Deadline Approaching');
      } else {
        setStatusText('Time Running');
      }
    }
  };

  useEffect(() => {
    fetchCountdown();
    // Poll backend every 15s to keep perfectly synchronized
    const syncInterval = setInterval(fetchCountdown, 15000);

    // Ticking interval every second
    const tickInterval = setInterval(() => {
      if (countdown?.has_active_countdown && countdown?.reporting_deadline) {
        calculateRemaining(countdown.reporting_deadline);
      }
    }, 1000);

    return () => {
      clearInterval(syncInterval);
      clearInterval(tickInterval);
    };
  }, [countdown?.reporting_deadline]);

  if (!countdown?.has_active_countdown) {
    return (
      <div style={{
        background: 'rgba(13, 22, 48, 0.6)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Clock size={20} style={{ color: 'var(--color-blue)' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>
              6-HOUR CERT-In STATUTORY REPORTING DEADLINE
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Standard readiness standby. Countdown will automatically start upon confirmed reportable cyber incident.
            </div>
          </div>
        </div>
        <span className="badge badge-safe">
          <CheckCircle2 size={13} /> Standby Ready (6h Available)
        </span>
      </div>
    );
  }

  const formatDigits = (val) => String(val).padStart(2, '0');

  return (
    <div className="countdown-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          background: isExpired ? 'rgba(239, 68, 68, 0.3)' : 'rgba(249, 115, 22, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isExpired ? '#ef4444' : '#f97316'
        }}>
          <AlertOctagon size={26} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.02em' }}>
              6-HOUR CERT-In REPORTING COUNTDOWN
            </span>
            <span className={`badge ${isExpired ? 'badge-critical' : timeLeft.hours < 1 ? 'badge-high-risk' : 'badge-warning'}`}>
              {statusText}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
            <strong>Incident ID:</strong> {countdown.incident_id} | <strong>Notice Time:</strong> {new Date(countdown.notice_time).toLocaleTimeString()} | <strong>Deadline:</strong> {new Date(countdown.reporting_deadline).toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="countdown-digits">
        <div className="digit-box">
          <div className="digit-val">{formatDigits(timeLeft.hours)}</div>
          <div className="digit-label">Hours</div>
        </div>
        <span style={{ fontSize: '20px', fontWeight: 700, color: '#f87171' }}>:</span>
        <div className="digit-box">
          <div className="digit-val">{formatDigits(timeLeft.minutes)}</div>
          <div className="digit-label">Mins</div>
        </div>
        <span style={{ fontSize: '20px', fontWeight: 700, color: '#f87171' }}>:</span>
        <div className="digit-box">
          <div className="digit-val">{formatDigits(timeLeft.seconds)}</div>
          <div className="digit-label">Secs</div>
        </div>
      </div>
    </div>
  );
}
