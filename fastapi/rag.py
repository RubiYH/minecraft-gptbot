from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env')

root_dir = "./github/mineflayer/"
root_pathfinder_dir = "./github/mineflayer-pathfinder/"
root_collectblock_dir = "./github/mineflayer-collectblock/"
root_node_minecraft_data_dir = "./github/node-minecraft-data/"
root_minecraft_data_dir = "./github/minecraft-data/"

from langchain_text_splitters import Language
from langchain_community.document_loaders.generic import GenericLoader
from langchain_community.document_loaders.parsers import LanguageParser
from langchain.tools.retriever import create_retriever_tool
from langchain_core.runnables import ConfigurableField
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
import os
from langchain_community.document_loaders import TextLoader

js_documents = []

for path in [root_dir, root_pathfinder_dir, root_minecraft_data_dir, root_collectblock_dir, root_minecraft_data_dir, root_node_minecraft_data_dir]:
    loader = GenericLoader.from_filesystem(
        path, 
        glob="**/*",
        suffixes=[".js"],
        parser=LanguageParser(
            language=Language.JS, parser_threshold=30, 
        ),
    )
    js_documents.extend(loader.load())

print(f".js 파일의 개수: {len(js_documents)}")

md_documents = []
for dirpath, dirnames, filenames in os.walk("./github"):
    for file in filenames:
        if (file.endswith(".md")) and "*venv/" not in dirpath:
            try:
                loader = TextLoader(os.path.join(dirpath, file), encoding="utf-8")
                md_documents.extend(loader.load())
            except Exception:
                pass

print(f".md 파일의 개수: {len(md_documents)}")

from langchain_text_splitters import RecursiveCharacterTextSplitter

js_splitter = RecursiveCharacterTextSplitter.from_language(
    language=Language.JS, chunk_size=2000, chunk_overlap=200
)

js_docs = js_splitter.split_documents(js_documents)

md_splitter = RecursiveCharacterTextSplitter(
    chunk_size=2000, chunk_overlap=200)

md_docs = md_splitter.split_documents(md_documents)

print(f"분할된 .js 파일의 개수: {len(js_docs)}")
print(f"분할된 .md 파일의 개수: {len(md_docs)}")

combined_documents = js_docs + md_docs
print(f"총 도큐먼트 개수: {len(combined_documents)}")

from langchain_openai import OpenAIEmbeddings
from langchain.storage import InMemoryStore
from langchain.retrievers import ParentDocumentRetriever
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever
from langchain_community.vectorstores import FAISS

child_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
splits = child_splitter.split_documents(js_docs)

bm25_retriever = BM25Retriever.from_documents(splits)
bm25_retriever.k = 10

vectorstore = FAISS.from_documents(documents=splits, embedding=OpenAIEmbeddings())

parent_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)

store = InMemoryStore()
parent_doc_retriever = ParentDocumentRetriever(vectorstore=vectorstore,docstore=store,child_splitter=child_splitter,parent_splitter=parent_splitter)

parent_doc_retriever.add_documents(js_docs, ids=None)

faiss_retriever = vectorstore.as_retriever(search_kwargs={"k": 10})

ensemble_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, faiss_retriever, parent_doc_retriever], weights=[0.3, 0.4, 0.3]
)

retriever_tool = create_retriever_tool(
    ensemble_retriever,
    name="mineflayer_code_search",
    description="Search for codes for mineflayer bot. Use this tool when user requested a bot to perform certain actions and answer only the codes that can be run inside asynchronous eval() in javascript."
)

from langchain_core.prompts import PromptTemplate

prompt = PromptTemplate.from_template(
    """You are an expert Minecraft bot named 'gptBot' who operates by self-coding, and you are currently in a Minecraft 1.20.4 server playing with a player. Your mission to assist the player by answering very kindly and perform actions using node.js Mineflayer codes directly when the player requests you to do something.

Question:
{question}

You must choose the type of your task by understanding the purpose and the given context, and must follow the format from the list below when responding;

# Type: Chat
## Purpose: To interact with qchat messages, normally to answer the question or simply respond to the user in text. Also used when performing vanilla Minecraft commands. When calculations or code expressions are needed you must use <action> instead.
## Format: <chat>{{message or Minecraft command goes here.}}</chat>
## Context:
    bot.chat('{{Your chat will go here. Respond with what should be written here. Only answer this line of the code.}}')

# Type: Action
## Purpose: To perform specific actions in-game such as to walk, fly, break blocks, hold items, etc. that are just everything except chat including interacting with Minecraft in-game.
## Format: <action>{{You must provide node.js Mineflayer code here.}}</action>
## Context:
    bot.on('messagestr', async (message, position, jsonMap) => {{
        {{Your code will go here. Respond with what should be written here. Only answer this part of the code.}}
    }});
## Rules:
- Before writing codes, please require libraries except 'mineflayer' in order to avoid node.js errors.
  you can also include other libraries if necessary.
- Don't start the code with bot event listeners.
- Don't include the code to create a bot.
- Use async/await methods when coding.
- Always brief about your task in chat.
- Specify the target according to the request whether it's the player's username, some entities, blocks, etc.
- When multiple tasks are provided, think about what to do first and next based on Chain-of-Thought prompt technique and write codes step by step.
- When answering the codes, do not wrap the codes in code block or do not say extra explanations. Just only give raw codes as a result.
- Remember previous chat history to understand current situation, but stop your task immediately and ask the player in chat for more details if the request is unclear. (e.g. the request hasn't specified which item the player wants.)

Previous chat history:
{chat_history}

References:
{context}

Response format:
Only response with "<type of your task>{{Response goes here.}}</type of your task>". Don't start with "Here is my response: ..."

"""
)

def query(input: str, history: list = []):
    llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.5,
    ).configurable_alternatives(
        ConfigurableField(id="llm"),
        default_key="gpt4o",
        gpt4turbo=ChatOpenAI(
            model="gpt-4-turbo",
            temperature=0.4
        ),
        opus=ChatAnthropic(
            model="claude-3-opus-20240229",
            temperature=0.2,
        ),
        gpt3=ChatOpenAI(
            model="gpt-3.5-turbo",
            temperature=0.2,
        ),
        sonnet=ChatAnthropic(
            model="claude-3-5-sonnet-20240620",
            temperature=0
        )
    )

    rag_chain = (
        {"context": ensemble_retriever, "question": RunnablePassthrough(), "chat_history": lambda _: history}
        | prompt
        | llm
        | StrOutputParser()
    )
    
    response = rag_chain.with_config(configurable={"llm": "opus"}).invoke(input)
    
    print(f"Response: {response}")
    return response
