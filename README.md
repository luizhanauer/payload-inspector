# ⚡ Payload Inspector & URL Debugger

Uma estação de trabalho **stateless** rodando 100% no navegador para inspeção, manipulação de payloads, testes de webhooks e fluxos de autenticação. Nenhuma API intermediária, nenhum banco de dados: apenas o seu navegador e a sua produtividade.

---

## 🛠️ O que é o projeto?

É um **ambiente completo de depuração e simulação de requisições HTTP**. Ele serve como um "espelho interativo" que reflete qualquer dado inserido manualmente ou enviado via URL (Query Strings/Hash), permitindo que o desenvolvedor visualize, formate, edite e teste esses dados rapidamente, gerando comandos nativos para o terminal e analisando a resposta no mesmo lugar.

---

## 🚀 Principais Funcionalidades

* **Injetor Interativo**: Adicione, edite ou remova chaves e valores. Se você inserir um JSON stringificado em um valor, ele será auto-formatado.
* **Formatador Inteligente (Auto-Format)**: Captura e converte `strings` que contêm estruturas JSON aninhadas em objetos legíveis com *Syntax Highlighting*.
* **Gerador de cURL Nativo**: Constrói o comando `cURL` exato com base no payload injetado. Suporta **Clipboard Piping** nativo (envia a resposta direto para a área de transferência usando `xclip` no Linux, `pbcopy` no Mac ou `clip` no Windows).
* **Analisador de Respostas**: Um ambiente dedicado para colar a saída bruta do terminal. Ele identifica se é um JSON válido e o indenta, ou preserva como texto/HTML caso seja uma página de erro (ex: 502 Bad Gateway).
* **Compartilhamento Stateless (Base64)**: Transforme todo o estado atual da sua tela (chaves e valores) em um link codificado seguro. Envie para um colega de equipe e ele verá exatamente a mesma tela, sem que nenhum dado seja salvo em um servidor.
* **Clipboard Seletivo**: Botões de cópia ágil espalhados por toda a interface para extrair chaves, tokens longos ou o JSON completo em um clique.

---

## 👥 Para quem é destinado?

1. **Desenvolvedores Backend**: Para testar a montagem de requisições e formatar respostas de logs brutos ou webhooks.
2. **Desenvolvedores Frontend**: Para validar redirecionamentos de tokens de autenticação (OAuth2, Auth0, Firebase) extraindo o `#hash` ou `?query` da URL automaticamente.
3. **Integradores de Webhooks**: Para colar um corpo de requisição recebido cru e entender a estrutura de forma visual.
4. **Analistas de QA (Testes)**: Para forçar mutações em payloads e gerar comandos cURL de simulação de erros rapidamente.

---

## 💡 Casos de Uso (Finalidades)

### 1. Depurando um Retorno OAuth2
* Configure a URL deste projeto hospedado no seu GitHub Pages como a `redirect_uri` no Google Cloud Console.
* Quando o Google devolver o usuário, a ferramenta extrairá o token da URL e o formatará instantaneamente na tela, pronto para ser copiado.

### 2. Ciclo Rápido de Request-Response (Hacker Workflow)
1. Preencha os campos no **Injetor** com os dados de teste.
2. No painel de **Gerador**, selecione `POST`, coloque a URL da API e escolha o pipe do seu SO (Ex: `Clipboard Linux`).
3. Clique em **Copiar Comando cURL**, cole no seu terminal e aperte `Enter`.
4. Volte para a ferramenta, clique no botão **"Colar Output"** no painel de **Analisador de Resposta** e inspecione o retorno formatado.

### 3. Compartilhamento de Cenário de Erro
A API está retornando erro `400` dependendo de um parâmetro específico? Monte o payload exato no Injetor que causa o erro, clique em **Compartilhar Sessão** e mande o link para o desenvolvedor responsável.

---

## 🏗️ Arquitetura e Engenharia

Este projeto foi construído focando em performance, tipagem rigorosa e design de software avançado:

* **Vue 3 + Vite + Tailwind CSS v4**: Ecossistema de frontend ultrarrápido.
* **TypeScript Estrito (`verbatimModuleSyntax`)**: Tipagem blindada, exigindo imports *Type-Only* para máxima otimização do build.
* **Domain-Driven Design (DDD)**: As lógicas de `SessionCodec`, `JsonAutoFormatter` e `RequestExporter` estão isoladas da camada visual (Vue), garantindo que a regra de negócio não se misture com reatividade.
* **Object Calisthenics**: Código escrito seguindo restrições severas de design (sem uso da palavra `else`, tipos primitivos encapsulados, funções curtas e objetivas).
* **Testes Unitários**: Regras de negócio essenciais amplamente cobertas utilizando **Vitest**, assegurando prevenção contra quebras em formatação de JSONs complexos ou comandos de terminal.

---

## 💻 Como Executar Localmente

### Pré-requisitos
* Node.js (v18 ou superior)
* NPM ou Yarn

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/luizhanauer/payload-inspector.git
cd payload-inspector
```

2. Instale as dependências:

```bash
npm install
```

3. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

4. Execute os testes unitários (Vitest):

```bash
npm run test
```

5. Gere a build para produção:

```bash
npm run build
```

## Contribuição

Contribuições são bem-vindas! Se você encontrar algum problema ou tiver sugestões para melhorar a aplicação, sinta-se à vontade para abrir uma issue ou enviar um pull request.

Se você gostou do meu trabalho e quer me agradecer, você pode me pagar um café :)

<a href="https://www.paypal.com/donate/?hosted_button_id=SFR785YEYHC4E" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 40px !important;width: 150px !important;" ></a>

## Licença

Este projeto está licenciado sob a Licença MIT. Consulte o arquivo LICENSE para obter mais informações.
