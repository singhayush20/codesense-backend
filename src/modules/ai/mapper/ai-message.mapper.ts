import {
  AssistantModelMessage,
  ModelMessage,
  SystemModelMessage,
  UserModelMessage,
} from 'ai';

import { LlmContent, LlmMessage } from '../dto/llm-message.dto';

export class AiSdkMessageMapper {
  static toModelMessages(messages: readonly LlmMessage[]): ModelMessage[] {
    return messages.map((message) => {
      switch (message.role) {
        case 'system':
          return this.mapSystemMessage(message);

        case 'user':
          return this.mapUserMessage(message);

        case 'assistant':
          return this.mapAssistantMessage(message);

        default:
          throw new Error('Unsupported message role');
      }
    });
  }

  private static mapSystemMessage(message: LlmMessage): SystemModelMessage {
    return {
      role: 'system',

      content: this.extractTextContent(message.content),
    };
  }

  private static mapUserMessage(message: LlmMessage): UserModelMessage {
    return {
      role: 'user',

      content: this.mapMultipartContent(message.content),
    };
  }

  private static mapAssistantMessage(
    message: LlmMessage,
  ): AssistantModelMessage {
    return {
      role: 'assistant',

      content: this.mapMultipartContent(message.content),
    };
  }

  private static extractTextContent(content: readonly LlmContent[]): string {
    return content
      .filter((item) => item.type === 'text')
      .map((item) => item.text)
      .join('\n');
  }

  private static mapMultipartContent(content: readonly LlmContent[]) {
    return content.map((item) => {
      switch (item.type) {
        case 'text':
          return {
            type: 'text' as const,

            text: item.text,
          };

        default:
          throw new Error('Unsupported content type');
      }
    });
  }
}
