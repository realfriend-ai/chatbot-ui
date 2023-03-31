import {IconKey} from '@tabler/icons-react';
import {useTranslation} from 'next-i18next';
import {buildSchema, parse, validate} from 'graphql';
import {FC, FormEvent, useState} from 'react';
import {SidebarButton} from '../Sidebar/SidebarButton';

export type GraphqlConf = {
    graphqlEndpoint?: string;
    endpointAccessToken?: string;
    graphqlSchema?: string;
};

interface Props {
    graphqlConf: GraphqlConf;
    onGraphqlConf: (graphqlConf: GraphqlConf) => void;
}


export const validateGraphqlSchema = (schemaString: string): string[] => {
    try {
        const schemaDocument = parse('query { __schema { queryType { name } }}');
        const schema = buildSchema(schemaString);
        const errors = validate(schema, schemaDocument);
        return errors.map((error) => error.message);
    } catch (error) {
        return [`${error}`];
    }
};

export const GraphqlChatConf: FC<Props> = ({graphqlConf, onGraphqlConf}) => {
    const {t} = useTranslation('sidebar');
    const [isOpen, setIsOpen] = useState(false);
    const [graphqlEndpoint, setGraphqlEndpoint] = useState(graphqlConf.graphqlEndpoint || "");
    const [endpointAccessToken, setEndpointAccessToken] = useState(graphqlConf.endpointAccessToken || "");
    const [graphqlSchema, setGraphqlSchema] = useState(graphqlConf.graphqlSchema || "");
    const [schemaError, setSchemaError] = useState("");

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const errors = validateGraphqlSchema(graphqlSchema);
        if (errors.length === 0) {
            setSchemaError("");
            setIsOpen(false);
            // Process form submission
            onGraphqlConf({graphqlSchema, endpointAccessToken, graphqlEndpoint});
        } else {
            setSchemaError("Invalid GraphQL Schema -\n" + errors.join(",\n"))
        }
    };

    return <>
        <SidebarButton
            text={t('Graphql Chat Conf') || ('Graphql Chat Conf')}
            icon={<IconKey size={18}/>}
            onClick={() => setIsOpen(true)}
        />
        {isOpen && (
            <div className="fixed inset-0 flex items-center justify-center z-10">
                <div
                    className="absolute inset-0 bg-black opacity-40"
                    onClick={() => setIsOpen(false)}
                ></div>
                <form
                    className="relative bg-white dark:bg-[#343541] shadow-lg rounded p-4 w-11/12 md:w-4/5 h-4/5 overflow-y-auto text-gray-800 dark:text-gray-100"
                    onSubmit={handleSubmit}
                >
                    <div className="mb-4">
                        <label htmlFor="url" className="block mb-1">
                            GraphQL Endpoint:
                        </label>
                        <input
                            type="url"
                            id="url"
                            className="w-11/12 p-2 border border-gray-300 rounded bg-transparent"
                            value={graphqlEndpoint}
                            onChange={(e) => setGraphqlEndpoint(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="endpointAccessToken" className="block mb-1">
                            Endpoint Access Token:
                        </label>
                        <input
                            type="text"
                            id="endpointAccessToken"
                            className="w-11/12 p-2 border border-gray-300 rounded bg-transparent"
                            value={endpointAccessToken}
                            onChange={(e) => setEndpointAccessToken(e.target.value)}
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="schema" className="block mb-1">
                            GraphQL Schema:
                        </label>
                        <textarea
                            id="schema"
                            className="w-11/12 h-full p-2 border border-gray-300 rounded bg-transparent"
                            value={graphqlSchema}
                            onChange={(e) => setGraphqlSchema(e.target.value)}
                            required
                        ></textarea>
                        {schemaError && (
                            <p className="text-red-500 text-sm mt-1">{schemaError}</p>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="bg-black text-white px-4 py-2 rounded"
                    >
                        Submit
                    </button>
                </form>
            </div>
        )}
    </>
};
