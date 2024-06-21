import axios from 'axios';
import {HttpsProxyAgent} from 'https-proxy-agent';
import { logger } from './logger';

export const api = (customOptions?: axios.CreateAxiosDefaults<any>, proxy?: string) => {
  customOptions = customOptions || {};
  const agentConfig = proxy ? {
    httpsAgent: new HttpsProxyAgent(proxy),
  } : {};
  
  logger.debug('proxy', agentConfig);
  
  const options = {...customOptions, ...agentConfig};
  const api = axios.create(options);
  return api;
}