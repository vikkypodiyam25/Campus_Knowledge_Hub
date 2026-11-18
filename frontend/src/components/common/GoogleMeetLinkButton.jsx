import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Video } from 'lucide-react';

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events.owned';

async function googleRequest(url, accessToken, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${accessToken}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message || 'Google Calendar could not create the meeting. Check that Calendar API is enabled for your Google project.');
  return body;
}

function AuthorizedMeetButton({ title, description, date, time, duration, onCreated }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const canCreate = Boolean(title.trim() && date && time);
  const googleLogin = useGoogleLogin({
    scope: CALENDAR_SCOPE,
    prompt: 'consent',
    onError: () => { setBusy(false); setMessage('Google authorization failed. Check that your account is allowed to use this app and try again.'); },
    onNonOAuthError: error => { setBusy(false); setMessage(error?.type === 'popup_closed' ? 'Google authorization window was closed before approval.' : 'The Google authorization window could not open. Allow pop-ups and try again.'); },
    onSuccess: async ({ access_token: accessToken }) => {
      let createdEventId = '';
      try {
        if (!accessToken) throw new Error('Google did not return calendar access. Please approve Calendar access and try again.');
        const start = new Date(`${date}T${time}:00`);
        if (Number.isNaN(start.getTime())) throw new Error('Choose a valid session date and time first.');
        const end = new Date(start.getTime() + Math.max(15, Number(duration) || 60) * 60_000);
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
        const requestId = globalThis.crypto?.randomUUID?.() || `meet-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const event = await googleRequest('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all', accessToken, {
          method: 'POST',
          body: JSON.stringify({
            summary: title.trim(),
            description: description.trim(),
            start: { dateTime: start.toISOString(), timeZone },
            end: { dateTime: end.toISOString(), timeZone },
            conferenceData: { createRequest: { requestId, conferenceSolutionKey: { type: 'hangoutsMeet' } } },
          }),
        });
        createdEventId = event.id || '';
        let meetLink = event.hangoutLink || event.conferenceData?.entryPoints?.find(point => point.entryPointType === 'video')?.uri;
        for (let attempt = 0; !meetLink && event.id && attempt < 15; attempt += 1) {
          if (event.conferenceData?.createRequest?.status?.statusCode === 'failure') throw new Error('Google Calendar could not provision a Meet room for this event. Check that Meet is available for the selected Google account.');
          await new Promise(resolve => window.setTimeout(resolve, 1000));
          const updated = await googleRequest(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(event.id)}?conferenceDataVersion=1`, accessToken);
          meetLink = updated.hangoutLink || updated.conferenceData?.entryPoints?.find(point => point.entryPointType === 'video')?.uri;
          event.conferenceData = updated.conferenceData;
        }
        if (!meetLink) throw new Error('Google Calendar did not return a Meet URL yet. Check that Calendar API and Google Meet are enabled for this account, then try again.');
        onCreated(meetLink);
        setMessage('Real Google Meet link created and added to the session. The event is on your Google Calendar.');
      } catch (error) {
        if (createdEventId) {
          try { await googleRequest(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(createdEventId)}`, accessToken, { method: 'DELETE' }); }
          catch { /* Keep the original error visible if Google refuses event cleanup. */ }
        }
        setMessage(error.message || 'Could not create the Google Meet link.');
      } finally { setBusy(false); }
    },
  });

  return <div className="meet-link-action">
    <button className="btn btn-outline" type="button" disabled={busy || !canCreate} onClick={() => { setBusy(true); setMessage(''); googleLogin(); }}><Video size={16}/>{busy ? 'Creating Meet link…' : 'Create Google Meet link'}</button>
    <small>Creates a real Google Calendar event and Meet room using the Google account you approve.</small>
    {message && <small role="status" className="meet-link-message">{message}</small>}
  </div>;
}

export default function GoogleMeetLinkButton({ enabled, ...props }) {
  if (!enabled) return null;
  return <AuthorizedMeetButton {...props}/>;
}
