import { createContext } from 'react';

const GoogleAuthContext = createContext({ clientId: '', loading: true });

export default GoogleAuthContext;
