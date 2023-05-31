import {FC, useState} from "react";
import {useTranslation} from "next-i18next";
import {PluginState} from "@/types/chat";

interface Props {
    pluginState: PluginState;
}

const LoadingSVG = () => (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24"
         strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-center ml-1"
         height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <line x1="12" y1="2" x2="12" y2="6"></line>
        <line x1="12" y1="18" x2="12" y2="22"></line>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
        <line x1="2" y1="12" x2="6" y2="12"></line>
        <line x1="18" y1="12" x2="22" y2="12"></line>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
    </svg>
)
export const PluginView: FC<Props> = ({
                                          pluginState
                                      }) => {
    const {t} = useTranslation('chat');
    const [isCollapsed, setIsCollapsed] = useState(false);
    if (!pluginState.isLoading) {
        return null;
    }

    return (
        <div className="flex flex-col items-start">
            <div
                className={`flex items-center text-xs rounded p-3 text-gray-900 ${pluginState.isLoading ? 'bg-green-100' : 'bg-gray-100'}`}>
                <div>
                    <div className="flex items-center gap-2">
                        {pluginState.isLoading ? <LoadingSVG/> :
                            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24"
                                 strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0"
                                 height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>}
                        <div>
                            {pluginState.finalResult}
                        </div>
                    </div>
                </div>
                {pluginState.steps.length ? (
                    <div className="ml-12 flex items-center gap-2" role="button"
                         onClick={() => setIsCollapsed(!isCollapsed)}>
                        {isCollapsed ? <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24"
                                            strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"
                                            height="1em"
                                            width="1em" xmlns="http://www.w3.org/2000/svg">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg> :
                            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24"
                                 strokeLinecap="round"
                                 strokeLinejoin="round" className="h-4 w-4" height="1em" width="1em"
                                 xmlns="http://www.w3.org/2000/svg">
                                <polyline points="18 15 12 9 6 15"></polyline>
                            </svg>}
                    </div>
                ) : null}
            </div>
            {isCollapsed || !pluginState.steps.length ? null : (
                <div
                    className="max-w-full overflow-x-auto mt-3 flex flex-col gap-2 rounded bg-gray-100 p-3 text-gray-800 text-xs">
                    {pluginState.steps.map((step, index) => (
                        <div key={"plugin-step" + index} className="flex items-center gap-2 min-h-[24px]">
                            {step.action} {step.result ? step.result.replace(/!\[.*?\]\(.*?\)/g, '|Rendered Chart|')
                            : <LoadingSVG/>
                        }
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

PluginView.displayName = 'PluginView';
