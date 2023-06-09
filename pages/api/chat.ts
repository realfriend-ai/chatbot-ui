import {ChatBody, Message} from '@/types/chat';
import {DEFAULT_SYSTEM_PROMPT} from '@/utils/app/const';
import {OpenAIStream} from '@/utils/server';
import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json';
import {init, Tiktoken} from '@dqbd/tiktoken/lite/init';
// @ts-expect-error
import wasm from '../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module';
import {OpenAIModelID} from "@/types/openai";
import {DataFrameAssistantStream} from "@/utils/server/data_frame_assistant_stream";

export const config = {
    runtime: 'edge',
};

const defaultHandler = async (data: ChatBody): Promise<Response> => {
    const {model, messages, key, prompt} = data;

    await init((imports) => WebAssembly.instantiate(wasm, imports));
    const encoding = new Tiktoken(
        tiktokenModel.bpe_ranks,
        tiktokenModel.special_tokens,
        tiktokenModel.pat_str,
    );

    let promptToSend = prompt;
    if (!promptToSend) {
        promptToSend = DEFAULT_SYSTEM_PROMPT;
    }

    const prompt_tokens = encoding.encode(promptToSend);

    let tokenCount = prompt_tokens.length;
    let messagesToSend: Message[] = [];

    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        const tokens = encoding.encode(message.content);

        if (tokenCount + tokens.length > model.tokenLimit) {
            break;
        }
        tokenCount += tokens.length;
        messagesToSend = [message, ...messagesToSend];
    }

    encoding.free();

    const stream = await OpenAIStream(model, promptToSend, key, messagesToSend);

    return new Response(stream);

};

const dataFrameAssistantHandler = async (data: ChatBody): Promise<Response> => {
    const {messages} = data;

    let messageToSend = messages[messages.length - 1];

    const stream = await DataFrameAssistantStream(messageToSend);

    return new Response(stream);
};

const handler = async (req: Request): Promise<Response> => {
    try {
        const data = (await req.json()) as ChatBody;
        if (!data.model.id || data.model.id === OpenAIModelID.DATA_FRAME_ASSISTANT) {
            return dataFrameAssistantHandler(data);
        }
        return defaultHandler(data);
    } catch (error) {
        console.error(error);
        return new Response('Error', {status: 500});
    }
};
export default handler;
