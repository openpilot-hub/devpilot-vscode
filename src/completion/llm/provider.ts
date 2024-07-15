import { LLMProvider, LLMProviderOption, ProviderType } from '../../typing';
import ZAProvider from './provider/za';
import OpenAIProvider from './provider/openai';
import AzureProvider from './provider/azure';

const provider = {
  get(name: ProviderType, options: LLMProviderOption): LLMProvider {
    switch (name) {
      case 'OpenAI':
        return new OpenAIProvider(options);
      case 'Azure':
        return new AzureProvider();
      default:
        return new ZAProvider();
    }
  },
};

export default provider;
