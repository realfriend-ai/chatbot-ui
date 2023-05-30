import {Message} from '@/types/chat';
import {createParser, ParsedEvent, ReconnectInterval,} from 'eventsource-parser';

function getDataFrameAssistantConsts(): { url: string; apiKey: string } {
    const url = process.env.DATA_FRAME_ASSISTANT_URL;
    const apiKey = process.env.DATA_FRAME_ASSISTANT_API_KEY || 'dummy'; // not used yet
    if (!url) {
        throw new Error('DATA_FRAME_ASSISTANT_URL is not set');
    }
    return {url, apiKey};
}

export const DataFrameAssistantStream = async (
        message: Message,
    ) => {
        const {url, apiKey} = getDataFrameAssistantConsts();
        const res = await fetch(
                url, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${apiKey}`

                    },
                    method: 'POST',
                    body: JSON.stringify({
                        query: message.content,
                        stream: true,
                    }),
                }
            )
        ;

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        if (res.status !== 200) {
            const statusText = res.statusText;
            const result = await res.body?.getReader().read();
            throw new Error(`Data Frame Assistant API returned an error: ${decoder.decode(result?.value) || statusText}`);
        }

        const stream = new ReadableStream({
            async start(controller) {
                const onParse = (event: ParsedEvent | ReconnectInterval) => {
                    if (event.type === 'event') {
                        const data = event.data;

                        if (data === '[DONE]') {
                            controller.close();
                            return;
                        }

                        try {
                            const json = JSON.parse(data);
                            const text = json.choices[0].delta.content;
                            const queue = encoder.encode(text);
                            controller.enqueue(queue);
                        } catch (e) {
                            controller.error(e);
                        }
                    }
                };

                const parser = createParser(onParse);

                for await (const chunk of res.body as any) {
                    parser.feed(decoder.decode(chunk));
                }
            },
        });

        return stream;
    }
;
