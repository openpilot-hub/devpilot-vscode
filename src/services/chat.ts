import { getStagedDiff } from '@/utils/git';
import { logger } from '@/utils/logger';
import request, { requestV2, ZAPI } from '@/utils/request';
import { notifyLogin } from './login';
import { API, PARAM_BASE64_ON } from '@/env';
import { ChatMessage, DevPilotFunctionality } from '@/typing';
import { configuration } from '@/configuration';
import { toBase64, wrapCodeRefInCodeblock } from '@/utils';
import type { IChatParam, IMessageData } from './types';
import { encodeRequestBody } from '@/utils/encode';

export const NO_STAGED_FILES = 'no staged files';

export async function chat(data: Partial<IChatParam>, options: { signal?: AbortSignal }) {
  let param: Partial<IChatParam> | string = {
    version: 'V240923',
    stream: false,
    ...data,
  };

  // console.log('=====', JSON.stringify(param));
  if (PARAM_BASE64_ON) {
    param = await encodeRequestBody(param);
  }
  // console.log('=====', param);

  return requestV2.post(ZAPI('chatV2'), param, options);
}

export async function generateCommitMsg(options: { signal?: AbortSignal }) {
  const diffStr = await getStagedDiff().catch((error) => {
    logger.error(error);
  });
  if (!diffStr) return Promise.resolve(NO_STAGED_FILES);

  return chat(
    {
      stream: false,
      messages: [
        {
          role: 'user',
          commandType: DevPilotFunctionality.GenerateCommit,
          promptData: {
            diff: diffStr,
            locale: configuration().llmLocale() === 'Chinese' ? 'zh_CN' : 'en_US',
          },
        },
      ],
    },
    { signal: options?.signal }
  )
    .then((res) => res.data?.choices?.[0]?.message?.content)
    .catch((err) => {
      if (err?.response?.status == 401) {
        notifyLogin();
      }
      return Promise.reject(err);
    });
}

export async function predictV2({ message, signal }: { message: ChatMessage; signal?: AbortSignal }) {
  const promptData = message.codeRef
    ? {
        selectedCode: wrapCodeRefInCodeblock(message.codeRef),
        language: 'javascript',
        commandTypeFor: message.commandType,
      }
    : undefined;

  const messages: IMessageData[] = [
    {
      role: 'user',
      commandType: DevPilotFunctionality.CodePrediction,
      promptData,
      content: message.content || undefined,
    },
  ];

  return chat({ messages }, { signal })
    .then((res) => {
      return res.data?.choices?.[0].message?.content;
    })
    .catch((err) => {
      console.error(err);
    });
}
