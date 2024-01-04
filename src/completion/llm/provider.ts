import { LLMProvider, LLMProviderOption, ProviderType } from "../typing";
import ZAProvider from "./provider/za";
import OpenAIProvider from "./provider/openai";
import AzureProvider from "./provider/azure";


const provider = {
  get(name: ProviderType, options: LLMProviderOption): LLMProvider {
    switch (name) {
      case 'za':
        return new ZAProvider();
      case 'openai':
        return new OpenAIProvider(options);
      case 'azure':
        return new AzureProvider();
      default:
        throw new Error('Unknown provider');
    }
  }
}

export default provider;
