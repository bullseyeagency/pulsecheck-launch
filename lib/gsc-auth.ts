import { google } from 'googleapis';

export function getGSCAuth() {
  const auth = new google.auth.JWT({
    email: process.env.GSC_CLIENT_EMAIL,
    key: process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });
  return auth;
}

export function getSearchConsole() {
  const auth = getGSCAuth();
  return google.searchconsole({ version: 'v1', auth });
}
