import {Message, PluginState} from '@/types/chat';
import {IconCheck, IconCopy, IconEdit} from '@tabler/icons-react';
import {useTranslation} from 'next-i18next';
import {FC, memo, useEffect, useRef, useState} from 'react';
import rehypeMathjax from 'rehype-mathjax';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import {CodeBlock} from '../Markdown/CodeBlock';
import {MemoizedReactMarkdown} from '../Markdown/MemoizedReactMarkdown';
import {PluginView} from "@/components/PluginView/PluginView";

interface Props {
    message: Message;
    messageIndex: number;
    onEditMessage: (message: Message, messageIndex: number) => void;
}

export const getPluginState = (message: string): PluginState => {
    let pluginState: PluginState = {
        isLoading: false,
        steps: [],
        finalResult: ''
    }
    const thoughtSeparator = '**Thought:**';
    const actionSeparator = '**Action:**';
    const actionInputSeparator = '**Action Input:**';
    const resultSeparator = '**Result:**';
    const errorSeparator = '**Error:**';
    const isPluginMessage = message.startsWith(thoughtSeparator);
    if (!isPluginMessage) {
        return pluginState;
    }
    pluginState.isLoading = true;
    pluginState.steps = message.split(thoughtSeparator).map((step) => {
        const actionSplit = step.split(actionSeparator);
        const thought = actionSplit?.[0].trim();
        const actionInputSplit = actionSplit?.[1]?.split(actionInputSeparator);
        const action = actionInputSplit?.[0]?.trim();
        let resultSplit = actionInputSplit?.[1]?.trim()?.split(resultSeparator);
        let isError = false;
        if (resultSplit?.length < 2) {
            resultSplit = actionInputSplit?.[1]?.trim()?.split(errorSeparator);
            isError = true;
        }
        const actionInput = resultSplit?.[0]?.trim();
        let result = resultSplit?.[1]?.trim();
        if (result && isError) {
            result = 'Error:' + result;
        }
        return {
            thought,
            action,
            actionInput,
            result
        }
    });
    if (message.indexOf('**Final Answer:**') !== -1 || message.indexOf(errorSeparator) !== -1) {
        pluginState.isLoading = false;
        pluginState.finalResult = message.split('**Final Answer:**')[1]?.trim() || "Error: " + message.split(errorSeparator)[1].trim();
    }
    return pluginState;
}

export const ChatMessage: FC<Props> = memo(
    ({message, messageIndex, onEditMessage}) => {
        const {t} = useTranslation('chat');
        const [isEditing, setIsEditing] = useState<boolean>(false);
        const [isTyping, setIsTyping] = useState<boolean>(false);
        const [messageContent, setMessageContent] = useState(message.content);
        const [messagedCopied, setMessageCopied] = useState(false);
        const [pluginState, setPluginState] = useState<PluginState>({
            isLoading: false,
            steps: [],
            finalResult: ''
        });

        const textareaRef = useRef<HTMLTextAreaElement>(null);

        const toggleEditing = () => {
            setIsEditing(!isEditing);
        };

        const handleInputChange = (
            event: React.ChangeEvent<HTMLTextAreaElement>,
        ) => {
            setMessageContent(event.target.value);
            if (textareaRef.current) {
                textareaRef.current.style.height = 'inherit';
                textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            }
        };

        const handleEditMessage = () => {
            if (message.content != messageContent) {
                onEditMessage({...message, content: messageContent}, messageIndex);
            }
            setIsEditing(false);
        };

        const handlePressEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !isTyping && !e.shiftKey) {
                e.preventDefault();
                handleEditMessage();
            }
        };

        const copyOnClick = () => {
            if (!navigator.clipboard) return;

            navigator.clipboard.writeText(message.content).then(() => {
                setMessageCopied(true);
                setTimeout(() => {
                    setMessageCopied(false);
                }, 2000);
            });
        };

        useEffect(() => {
            if (textareaRef.current) {
                textareaRef.current.style.height = 'inherit';
                textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            }
        }, [isEditing]);

        useEffect(() => {
            if (message.content) {
                setPluginState(getPluginState(message.content));
            }
        }, [message.content]);


        return (
            <div
                className={`group px-4 ${
                    message.role === 'assistant'
                        ? 'border-b border-black/10 bg-gray-50 text-gray-800 dark:border-gray-900/50 dark:bg-[#444654] dark:text-gray-100'
                        : 'border-b border-black/10 bg-white text-gray-800 dark:border-gray-900/50 dark:bg-[#343541] dark:text-gray-100'
                }`}
                style={{overflowWrap: 'anywhere'}}
            >
                <div
                    className="relative m-auto flex gap-4 p-4 text-base md:max-w-2xl md:gap-6 md:py-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
                    <div className="min-w-[40px] text-right font-bold">
                        {message.role === 'assistant' ? t('AI') : t('You')}:
                    </div>

                    <div className="prose mt-[-2px] w-full dark:prose-invert">
                        {message.role === 'user' ? (
                            <div className="flex w-full">
                                {isEditing ? (
                                    <div className="flex w-full flex-col">
                    <textarea
                        ref={textareaRef}
                        className="w-full resize-none whitespace-pre-wrap border-none dark:bg-[#343541]"
                        value={messageContent}
                        onChange={handleInputChange}
                        onKeyDown={handlePressEnter}
                        onCompositionStart={() => setIsTyping(true)}
                        onCompositionEnd={() => setIsTyping(false)}
                        style={{
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            lineHeight: 'inherit',
                            padding: '0',
                            margin: '0',
                            overflow: 'hidden',
                        }}
                    />

                                        <div className="mt-10 flex justify-center space-x-4">
                                            <button
                                                className="h-[40px] rounded-md bg-blue-500 px-4 py-1 text-sm font-medium text-white enabled:hover:bg-blue-600 disabled:opacity-50"
                                                onClick={handleEditMessage}
                                                disabled={messageContent.trim().length <= 0}
                                            >
                                                {t('Save & Submit')}
                                            </button>
                                            <button
                                                className="h-[40px] rounded-md border border-neutral-300 px-4 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                                onClick={() => {
                                                    setMessageContent(message.content);
                                                    setIsEditing(false);
                                                }}
                                            >
                                                {t('Cancel')}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="prose whitespace-pre-wrap dark:prose-invert">
                                        {message.content}
                                    </div>
                                )}

                                {(window.innerWidth < 640 || !isEditing) && (
                                    <button
                                        className={`absolute translate-x-[1000px] text-gray-500 hover:text-gray-700 focus:translate-x-0 group-hover:translate-x-0 dark:text-gray-400 dark:hover:text-gray-300 ${
                                            window.innerWidth < 640
                                                ? 'right-3 bottom-1'
                                                : 'right-0 top-[26px]'
                                        }
                    `}
                                        onClick={toggleEditing}
                                    >
                                        <IconEdit size={20}/>
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div
                                    className={`absolute ${
                                        window.innerWidth < 640
                                            ? 'right-3 bottom-1'
                                            : 'right-0 top-[26px] m-0'
                                    }`}
                                >
                                    {messagedCopied ? (
                                        <IconCheck
                                            size={20}
                                            className="text-green-500 dark:text-green-400"
                                        />
                                    ) : (
                                        <button
                                            className="translate-x-[1000px] text-gray-500 hover:text-gray-700 focus:translate-x-0 group-hover:translate-x-0 dark:text-gray-400 dark:hover:text-gray-300"
                                            onClick={copyOnClick}
                                        >
                                            <IconCopy size={20}/>
                                        </button>
                                    )}
                                </div>
                                {(pluginState?.isLoading || pluginState?.steps.length) ?
                                    <PluginView pluginState={pluginState}/> : null}
                                <div
                                    className={"min-h-[20px] flex flex-col items-start gap-4 whitespace-pre-wrap break-words"}>
                                    <MemoizedReactMarkdown
                                        className="prose dark:prose-invert"
                                        remarkPlugins={[remarkGfm, remarkMath]}
                                        rehypePlugins={[rehypeMathjax]}
                                        components={{
                                            code({node, inline, className, children, ...props}) {
                                                const match = /language-(\w+)/.exec(className || '');

                                                return !inline && match ? (
                                                    <CodeBlock
                                                        key={Math.random()}
                                                        language={match[1]}
                                                        value={String(children).replace(/\n$/, '')}
                                                        {...props}
                                                    />
                                                ) : (
                                                    <code className={className} {...props}>
                                                        {children}
                                                    </code>
                                                );
                                            },
                                            table({children}) {
                                                return (
                                                    <table
                                                        className="border-collapse border border-black py-1 px-3 dark:border-white">
                                                        {children}
                                                    </table>
                                                );
                                            },
                                            th({children}) {
                                                return (
                                                    <th className="break-words border border-black bg-gray-500 py-1 px-3 text-white dark:border-white">
                                                        {children}
                                                    </th>
                                                );
                                            },
                                            td({children}) {
                                                return (
                                                    <td className="break-words border border-black py-1 px-3 dark:border-white">
                                                        {children}
                                                    </td>
                                                );
                                            },
                                        }}
                                    >
                                        {/*{pluginState?.finalResult ? pluginState?.finalResult : message.content}*/}
                                        {message.content}
                                    </MemoizedReactMarkdown>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    },
);
ChatMessage.displayName = 'ChatMessage';
