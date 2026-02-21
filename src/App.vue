<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import 'highlight.js/styles/atom-one-dark.css';

import { SessionCodec, SessionData, EncodedString } from './domain/SessionCodec';
import { JsonAutoFormatter } from './domain/JsonAutoFormatter';
import { PayloadBuilder, type EditorEntry } from './domain/PayloadBuilder';
import { ClipboardService } from './infrastructure/ClipboardService';
import { RequestExporter, type OutputAction } from './domain/RequestExporter';

hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);

interface ToastMessage {
  id: string;
  text: string;
}

const payloadData = ref<Record<string, unknown>>({});
const editorEntries = ref<EditorEntry[]>([]);
const toasts = ref<ToastMessage[]>([]);
const isCopied = ref<boolean>(false);

const targetBaseUrl = ref<string>('');
const httpMethod = ref<string>('POST');
const outputAction = ref<OutputAction>('none');
const rawResponseInput = ref<string>('');

const codec = new SessionCodec();
const formatter = new JsonAutoFormatter();
const builder = new PayloadBuilder();
const clipboard = new ClipboardService();
const exporter = new RequestExporter();

const syncToPayload = (): void => {
  payloadData.value = builder.buildFromEntries(editorEntries.value);
};

const initializeFromUrl = (): void => {
  const urlParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.substring(1);
  const sessionParam: string | null = urlParams.get('s');
  
  let initialData: Record<string, unknown> = {};

  if (sessionParam !== null) {
    const encoded = new EncodedString(sessionParam);
    const session = codec.decode(encoded);
    initialData = session.retrieve();
  }

  if (sessionParam === null) {
    const extractedData: Record<string, string> = {};
    urlParams.forEach((value: string, key: string) => extractedData[key] = value);
    const hashParams = new URLSearchParams(hash);
    hashParams.forEach((value: string, key: string) => extractedData[key] = value);

    if (Object.keys(extractedData).length > 0) {
      initialData = extractedData;
    }
  }

  if (Object.keys(initialData).length === 0) {
    initialData = {
      status: "success",
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      nested_data: "{\"user\": {\"id\": 42, \"name\": \"Dev\"}, \"active\": true}"
    };
  }

  payloadData.value = formatter.format(initialData);
  editorEntries.value = builder.convertRecordToEntries(payloadData.value);
};

onMounted(() => {
  initializeFromUrl();
});

const addNewEntry = (): void => {
  const newEntry: EditorEntry = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2),
    key: '',
    value: ''
  };
  editorEntries.value.push(newEntry);
  syncToPayload();
};

const removeEntry = (idToRemove: string): void => {
  editorEntries.value = editorEntries.value.filter((entry: EditorEntry) => entry.id !== idToRemove);
  syncToPayload();
};

const showToast = (message: string): void => {
  const newToast: ToastMessage = { id: Date.now().toString(36), text: message };
  toasts.value.push(newToast);
  setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== newToast.id); }, 3000);
};

const copyText = async (text: string, label: string): Promise<void> => {
  if (!text) return;
  const success: boolean = await clipboard.copy(text);
  if (success) {
    showToast(`${label} copiado!`);
  }
};

const pasteToAnalyzer = async (): Promise<void> => {
  const text: string = await clipboard.paste();
  const hasContent: boolean = text.trim().length > 0;
  
  if (hasContent) {
    rawResponseInput.value = text;
    showToast('Conteúdo colado com sucesso!');
    return;
  }

  showToast('Falha ao colar: Área de transferência vazia ou permissão negada.');
};

const generateShareLink = async (): Promise<void> => {
  const session = new SessionData(payloadData.value);
  const encoded = codec.encode(session);
  const newUrl: string = `${window.location.origin}${window.location.pathname}?s=${encoded.retrieve()}`;
  
  const success: boolean = await clipboard.copy(newUrl);
  if (success) {
    isCopied.value = true;
    showToast('Link da sessão copiado!');
    setTimeout(() => { isCopied.value = false; }, 2000);
  }
};

const clearSession = (): void => {
  editorEntries.value = [];
  payloadData.value = {};
  rawResponseInput.value = '';
  
  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.pushState({}, document.title, cleanUrl);
  
  showToast('Sessão limpa com sucesso!');
};

const formattedJson = computed((): string => {
  const rawJson: string = JSON.stringify(payloadData.value, null, 2);
  return hljs.highlight(rawJson, { language: 'json' }).value;
});

const finalUrlPreview = computed((): string => {
  return exporter.generateFinalUrl(httpMethod.value, targetBaseUrl.value, payloadData.value);
});

const curlSnippetPreview = computed((): string => {
  const curlCmd: string = exporter.generateCurl(httpMethod.value, targetBaseUrl.value, payloadData.value, outputAction.value);
  return hljs.highlight(curlCmd, { language: 'bash' }).value;
});

const formattedResponse = computed((): string => {
  if (!rawResponseInput.value.trim()) {
    return hljs.highlight('// Resposta aparecerá aqui...', { language: 'json' }).value;
  }
  try {
    const parsed: unknown = JSON.parse(rawResponseInput.value);
    return hljs.highlight(JSON.stringify(parsed, null, 2), { language: 'json' }).value;
  } catch {
    return hljs.highlight(rawResponseInput.value, { language: 'json' }).value;
  }
});
</script>

<template>
  <div class="min-h-screen p-4 md:p-8 font-mono relative pb-20">
    
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <transition-group name="toast">
        <div 
          v-for="toast in toasts" 
          :key="toast.id"
          class="bg-dark-card border-l-4 border-neon-green px-4 py-3 rounded shadow-[0_0_15px_rgba(57,255,20,0.1)] flex items-center gap-3 text-sm text-white pointer-events-auto"
        >
          <span class="text-neon-green">✓</span>
          {{ toast.text }}
        </div>
      </transition-group>
    </div>

    <header class="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <span class="text-neon-green">⚡</span>
          Payload<span class="text-neon-blue">Inspector</span>
        </h1>
        <p class="text-gray-400 text-sm mt-1">Estação de depuração e manipulação de URLs e Webhooks.</p>
      </div>

      <div class="flex items-center gap-3">
        <button 
          @click="clearSession"
          class="group relative px-4 py-2 bg-dark-card border border-red-500/30 text-red-400 rounded-md hover:bg-red-500/10 hover:border-red-500 transition-all duration-300 cursor-pointer text-sm flex items-center gap-2"
          title="Resetar todos os dados"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
          Limpar
        </button>

        <button 
          @click="generateShareLink"
          class="group relative px-6 py-2 bg-dark-card border border-neon-blue/30 text-neon-blue rounded-md hover:bg-neon-blue/10 hover:border-neon-blue transition-all duration-300 shadow-[0_0_15px_rgba(0,243,255,0.1)] hover:shadow-[0_0_20px_rgba(0,243,255,0.3)] cursor-pointer text-sm"
          title="Gera um link contendo o estado atual para enviar à equipe"
        >
          {{ isCopied ? 'Link Copiado!' : 'Compartilhar Sessão' }}
        </button>
      </div>
    </header>

    <main class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      
      <section class="lg:col-span-1 bg-dark-card border border-dark-border rounded-xl p-5 shadow-lg flex flex-col h-[55vh]">
        <div class="flex flex-col mb-4 border-b border-dark-border pb-3">
          <div class="flex justify-between items-center">
            <h2 class="text-lg text-white font-semibold">Injetor de Dados</h2>
            <span class="text-xs text-gray-400 bg-[#0d0d0d] px-2 py-1 rounded">{{ editorEntries.length }} itens</span>
          </div>
          <p class="text-[11px] text-gray-500 mt-1 leading-relaxed">Adicione parâmetros para simular o corpo da requisição. Valores JSON serão auto-formatados.</p>
        </div>
        
        <div class="flex-grow overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          <div v-for="(entry) in editorEntries" :key="entry.id" class="flex items-start gap-2 group relative">
            <div class="w-1/3 relative">
              <input v-model="entry.key" @input="syncToPayload" class="w-full bg-[#0d0d0d] border border-dark-border rounded pl-2 pr-6 py-1.5 text-neon-blue focus:outline-none focus:border-neon-blue text-xs transition-colors" placeholder="Ex: status" title="Nome do campo" />
              <button @click="copyText(entry.key, 'Chave')" class="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-neon-blue transition-colors cursor-pointer" title="Copiar chave">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
            </div>
            
            <div class="flex-grow relative">
              <input v-model="entry.value" @input="syncToPayload" class="w-full bg-[#0d0d0d] border border-dark-border rounded pl-2 pr-8 py-1.5 text-neon-green focus:outline-none focus:border-neon-green text-xs transition-colors" placeholder="Ex: success ou { ... }" title="Valor correspondente" />
              <button @click="copyText(entry.value, entry.key || 'Valor')" class="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-neon-green transition-colors cursor-pointer" title="Copiar valor bruto">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
            </div>

            <button @click="removeEntry(entry.id)" class="text-gray-600 hover:text-red-500 py-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex-shrink-0" title="Remover parâmetro">✕</button>
          </div>

          <button @click="addNewEntry" class="w-full mt-4 py-2 border border-dashed border-dark-border text-gray-500 hover:text-neon-green hover:border-neon-green rounded-md transition-all text-sm cursor-pointer">+ Adicionar Parâmetro</button>
        </div>
      </section>

      <section class="lg:col-span-2 bg-dark-card border border-dark-border rounded-xl p-0 shadow-lg flex flex-col overflow-hidden h-[55vh]">
        <div class="p-4 border-b border-dark-border bg-dark-card/50 flex flex-col">
          <div class="flex justify-between items-center">
            <h2 class="text-lg text-white font-semibold flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-neon-green shadow-[0_0_8px_#39ff14]"></span>
              Payload Final Estruturado
            </h2>
            <button @click="copyText(JSON.stringify(payloadData, null, 2), 'JSON Completo')" class="text-xs bg-dark-border hover:bg-[#2a2a2a] px-3 py-1.5 rounded text-gray-300 transition-colors cursor-pointer flex items-center gap-2" title="Copia o objeto inteiro">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copiar JSON
            </button>
          </div>
          <p class="text-[11px] text-gray-500 mt-1">Reflexo em tempo real dos dados injetados. Stringificações são resolvidas automaticamente.</p>
        </div>
        
        <div class="flex-grow overflow-auto p-4 bg-[#0d0d0d] custom-scrollbar">
          <pre><code class="hljs rounded-lg text-sm" v-html="formattedJson"></code></pre>
        </div>
      </section>
    </main>

    <section class="max-w-6xl mx-auto bg-dark-card border border-dark-border rounded-xl shadow-lg overflow-hidden mt-6">
      <div class="p-4 border-b border-dark-border bg-dark-card/50 flex flex-col">
        <div class="flex flex-col md:flex-row md:items-center gap-4">
          <h2 class="text-lg text-white font-semibold whitespace-nowrap">Gerador de Requisição API</h2>
          
          <div class="flex-grow flex gap-2">
            <select v-model="httpMethod" title="Método HTTP" class="bg-[#0d0d0d] border border-dark-border rounded px-3 py-2 text-neon-blue focus:outline-none focus:border-neon-blue text-sm cursor-pointer">
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input v-model="targetBaseUrl" title="Endereço da API" class="flex-grow bg-[#0d0d0d] border border-dark-border rounded px-3 py-2 text-white focus:outline-none focus:border-neon-green text-sm transition-colors" placeholder="Digite a URL de destino (Ex: https://api.exemplo.com/webhook)" />
          </div>
        </div>
        <p class="text-[11px] text-gray-500 mt-2">Defina o endpoint e copie o comando para testar via terminal. O body/query será preenchido com o Payload Estruturado acima.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-dark-border">
        <div class="p-4 bg-[#0d0d0d] relative group">
          <span class="text-xs text-gray-500 block mb-2 font-semibold">ESPELHO DA URL DE ENVIO</span>
          <p class="text-sm text-gray-300 break-all pr-8">{{ finalUrlPreview }}</p>
          <button @click="copyText(finalUrlPreview, 'URL Final')" class="absolute top-4 right-4 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1" title="Copiar URL">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
        </div>

        <div class="p-4 bg-[#080808] relative group overflow-hidden flex flex-col">
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs text-gray-500 font-semibold">COMANDO TERMINAL (cURL)</span>
            <select v-model="outputAction" title="Tratamento de Saída do Comando" class="bg-transparent border border-dark-border rounded px-2 py-0.5 text-xs text-gray-400 focus:outline-none focus:border-neon-blue cursor-pointer">
              <option value="none">Retorno no Terminal (Padrão)</option>
              <option value="file">Salvar Saída em response.txt</option>
              <option value="linux">Jogar para Clipboard Linux (Usa xclip)</option>
              <option value="mac">Jogar para Clipboard Mac (Usa pbcopy)</option>
              <option value="windows">Jogar para Clipboard Windows (Usa clip)</option>
            </select>
          </div>
          <div class="overflow-x-auto custom-scrollbar pb-2 flex-grow">
            <pre><code class="hljs text-sm whitespace-pre" v-html="curlSnippetPreview"></code></pre>
          </div>
          <button @click="copyText(exporter.generateCurl(httpMethod, targetBaseUrl, payloadData, outputAction), 'Comando cURL')" class="absolute top-8 right-4 text-gray-500 hover:text-neon-green opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1 bg-[#080808]/80 rounded" title="Copiar script cURL">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
        </div>
      </div>
    </section>

    <section class="max-w-6xl mx-auto mt-6 bg-dark-card border border-dark-border rounded-xl shadow-lg flex flex-col overflow-hidden">
      <div class="p-4 border-b border-dark-border bg-dark-card/50 flex flex-col">
        <div class="flex justify-between items-center">
          <h2 class="text-lg text-white font-semibold flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-neon-blue shadow-[0_0_8px_#00f3ff]"></span>
            Validador de Respostas (Response)
          </h2>
          
          <button 
            @click="pasteToAnalyzer" 
            class="text-xs bg-dark-border hover:bg-[#2a2a2a] px-3 py-1.5 rounded text-neon-blue border border-neon-blue/30 transition-colors cursor-pointer flex items-center gap-2"
            title="Cola o último texto copiado para sua área de transferência"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
            Colar Output
          </button>
        </div>
        <p class="text-[11px] text-gray-500 mt-1">Execute o cURL no terminal e cole o resultado obtido aqui. Erros HTML ou textos serão mantidos, mas JSONs serão indentados.</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-dark-border">
        <div class="p-0 bg-[#0a0a0a]">
          <textarea 
            v-model="rawResponseInput"
            class="w-full h-full min-h-[200px] bg-transparent text-gray-300 p-4 resize-none focus:outline-none custom-scrollbar text-sm"
            placeholder="Cole (Ctrl+V) a resposta devolvida pela sua API neste bloco..."
            title="Área para colar o resultado do teste"
          ></textarea>
        </div>
        
        <div class="p-4 bg-[#0d0d0d] overflow-auto custom-scrollbar min-h-[200px] max-h-[400px]" title="Visualização estruturada da resposta">
          <pre><code class="hljs rounded-lg text-sm" v-html="formattedResponse"></code></pre>
        </div>
      </div>
    </section>

  </div>
</template>

<style>
.hljs { background: transparent !important; }
.hljs-attr { color: var(--color-neon-blue) !important; }
.hljs-string { color: var(--color-neon-green) !important; }
.hljs-number, .hljs-literal { color: #ffb86c !important; }

.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-dark-border); border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f3f; }

.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from { opacity: 0; transform: translateX(30px); }
.toast-leave-to { opacity: 0; transform: translateY(20px); }
</style>