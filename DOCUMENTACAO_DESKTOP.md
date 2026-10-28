# Terminal Clandestino de Gerenciamento de Runner — Documentação Desktop (Windows)

**Identificação Oficial:** Shadowrun: Anarchy — Gerenciador de Fichas  
**Desenvolvido por:** Pedro Moreira de Souza  
**Direitos Autorais:** © 2026 Pedro Moreira de Souza. Direitos reservados aos respectivos titulares.  
**Termos de Licença:** Proprietária para uso pessoal (consulte `LICENSE.md` e `THIRD-PARTY-NOTICES.md`).  

Este documento descreve a versão desktop para Windows do gerenciador de fichas de Shadowrun: Anarchy. Ele reúne instruções de uso para os jogadores e mestres, além de detalhes de arquitetura, persistência e compilação para quem for manter ou desenvolver o projeto.

---

## 1. Visão Geral

A aplicação desktop foi construída com Electron (versão 33) a partir da aplicação web original, mantendo a interface visual, os temas de alto contraste, as regras do sistema, o rolador de dados e o cálculo automático de atributos, perícias, danos e essência.

Diferente da versão web que depende do armazenamento do navegador (LocalStorage), a versão desktop salva as fichas diretamente no sistema de arquivos do computador, em formato legível (JSON), permitindo exportações, importações, backups consolidados e uso sem conexão com a internet.

### Executáveis Disponíveis

Após o processo de compilação, os executáveis são gerados no diretório `dist/`:

1. **Instalador para Windows (NSIS)**
   - Arquivo: `dist/Terminal Clandestino de Gerenciamento de Runner Setup 1.0.0.exe` (~83 MB)
   - Permite escolher a pasta de instalação e cria atalhos no Menu Iniciar e na Área de Trabalho.
   - O instalador está configurado com `deleteAppDataOnUninstall: false`. Isso significa que, se o usuário desinstalar o aplicativo ou atualizar para uma nova versão, os arquivos de fichas e configurações salvas na pasta do usuário não serão excluídos.

2. **Versão Portátil (Standalone)**
   - Arquivo: `dist/Terminal Clandestino de Gerenciamento de Runner-Portable-1.0.0.exe` (~75 MB)
   - Executável único que roda sem necessidade de instalação prévia. Pode ser colocado em qualquer pasta ou executado diretamente de uma unidade removível (pendrive). Os dados de fichas continuam sendo salvos na pasta de dados do usuário no Windows.

3. **Versão Descompactada (win-unpacked)**
   - Pasta: `dist/win-unpacked/`
   - Contém o executável `Terminal Clandestino de Gerenciamento de Runner.exe` e as dependências já extraídas, utilizada principalmente para depuração e testes rápidos antes do empacotamento.

---

## 2. Manual do Usuário

### Aviso do Windows SmartScreen na Primeira Execução

Ao abrir o instalador ou a versão portátil pela primeira vez, o Windows Defender SmartScreen pode exibir um alerta informando que impediu a inicialização de um aplicativo não reconhecido.

**Por que isso acontece:**  
O SmartScreen alerta sobre executáveis novos que não possuem um certificado digital de assinatura de código emitido por uma autoridade comercial reconhecida pela Microsoft.

**Como proceder:**
1. Certifique-se de que o executável veio de uma fonte confiável (como o repositório oficial do projeto ou compilado localmente por você).
2. Se você confia na procedência do arquivo, clique em **"Mais informações"**.
3. Em seguida, clique no botão **"Executar assim mesmo"**.
4. O Windows memorizará a permissão e o aplicativo iniciará normalmente nas próximas vezes.

### Interface e Atalhos de Teclado

Para manter o visual limpo e imersivo da tela, a versão para Windows não exibe a barra de menus tradicional no topo da janela. As ações podem ser realizadas pelos botões da interface ou pelos atalhos de teclado:

| Atalho | Ação | Descrição |
| :--- | :--- | :--- |
| `Ctrl + S` | Salvar Ficha | Força a gravação imediata da ficha ativa no disco |
| `Ctrl + N` | Nova Ficha | Abre uma nova ficha com valores padrão de criação |
| `Ctrl + M` | Gerenciar Fichas | Abre a janela com a lista de fichas salvas (Roster) |
| `Ctrl + E` | Exportar Ficha | Abre a caixa de diálogo para salvar a ficha atual em arquivo `.json` |
| `Ctrl + O` | Importar Ficha | Abre a caixa de diálogo para carregar um arquivo `.json` de ficha |
| `Ctrl + P` | Imprimir / PDF | Abre a janela de impressão do sistema para imprimir ou gerar PDF |
| `Ctrl + D` | Rolar D6 | Abre o painel de rolagem de dados D6 |
| `Ctrl + T` | Alternar Tema | Abre a seleção de temas cromáticos da interface |
| `F11` | Tela Cheia | Alterna entre o modo janela e o modo tela cheia |
| `F5` ou `Ctrl + R` | Recarregar | Recarrega a interface do aplicativo |

### Gerenciamento de Fichas

Ao clicar no botão **FICHAS** no topo da tela (ou usar o atalho `Ctrl + M`), o painel de gerenciamento de fichas é exibido:

- **Alternar ficha ativa:** Clique no nome de qualquer ficha listada para carregá-la imediatamente.
- **Duplicar ficha:** Cria uma cópia independente da ficha selecionada.
- **Excluir ficha:** Remove a ficha da lista e apaga o arquivo correspondente no disco (após confirmação).
- **Exportar e Importar individual:** Permite compartilhar fichas individuais em formato `.json` com outros jogadores.
- **Backup Total:** Salva todas as fichas da lista em um único arquivo `.json` consolidado.
- **Restaurar Backup:** Importa um arquivo de backup consolidado, mesclando ou restaurando os personagens.
- **Abrir Pasta de Dados:** Abre diretamente a pasta de armazenamento no Windows Explorer.

### Onde os Dados Ficam Salvos

No Windows, todos os arquivos gerados pelo aplicativo ficam no diretório de dados do usuário:

```text
%APPDATA%/Shadowrun Anarchy/data/
```
*(Geralmente em `C:\Users\<SeuUsuario>\AppData\Roaming\Shadowrun Anarchy\data\`)*

A estrutura de arquivos nessa pasta é organizada da seguinte forma:

```text
data/
├── characters/
│   ├── char_1740000000_abc12.json    (arquivo individual de cada ficha)
│   └── ...
├── roster.json                       (índice geral com a lista e ordem das fichas)
├── settings.json                     (preferências da janela, tema ativo e última ficha aberta)
└── backups/                          (cópias automáticas de segurança mantidas pelo sistema)
    ├── backup_snapshot_2026-10-27.json
    └── ...
```

### Salvamento e Segurança dos Dados

- **Salvamento automático com debounce:** Conforme os campos da ficha são editados, o aplicativo agenda o salvamento automático com um intervalo de 350 milissegundos após a última digitação. O rodapé da tela informa o status atual da operação (ex.: *Salvando...*, *Salvo no disco às HH:MM:SS* ou mensagem de erro em caso de falha).
- **Escrita atômica de arquivos:** Ao salvar, o aplicativo escreve os dados primeiro em um arquivo temporário (`.tmp`) no mesmo diretório e, em seguida, renomeia o arquivo temporário para o nome final. Se ocorrer uma queda de energia ou fechamento abrupto durante a gravação, o arquivo anterior tem maior chance de permanecer íntegro. No Windows, caso o sistema operacional bloqueie temporariamente a renomeação direta, o serviço recorre a uma cópia de segurança antes de remover o arquivo temporário.
- **Backups rotativos automáticos:** O serviço mantém até 20 snapshots automáticos na pasta `backups/`, permitindo recuperar estados anteriores caso algum arquivo seja corrompido ou excluído acidentalmente.
- **Limitações:** Embora a escrita atômica e os backups rotativos reduzam significativamente o risco de perda de informações, falhas graves de hardware, corrupção do disco ou encerramentos forçados no momento exato da sincronização do sistema de arquivos ainda podem afetar a gravação. Recomenda-se realizar backups periódicos por meio do botão **Backup Total**.

---

## 3. Arquitetura Técnica

O aplicativo é composto por três camadas principais integradas via IPC (Inter-Process Communication):

```text
┌─────────────────────────────────────────────────────────────┐
│                 PROCESSO PRINCIPAL (Node.js)                │
│  - electron/main.js: Janelas, ciclo de vida, atalhos, PDFs  │
│  - electron/storage-service.js: Leitura, escrita e backups  │
└──────────────────────────────┬──────────────────────────────┘
                               │ IPC (ipcMain / ipcRenderer)
┌──────────────────────────────▼──────────────────────────────┐
│                    PRELOAD (Isolamento)                     │
│  - electron/preload.js: contextBridge                       │
│  - Expõe apenas métodos permitidos em window.electronAPI    │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                 RENDERER (Interface Web)                    │
│  - index.html, folhas de estilo em css/                     │
│  - Lógica da aplicação compilada em js/bundle.js            │
└─────────────────────────────────────────────────────────────┘
```

### Isolamento de Contexto e Segurança

- **`contextIsolation: true`:** O código executado na página web (Renderer) não tem acesso direto aos módulos nativos do Node.js (`fs`, `path`, `child_process`).
- **`nodeIntegration: false`:** Desativa recursos do Node.js no contexto da janela do navegador, reduzindo a superfície de vulnerabilidades.
- **Ponte de API (`window.electronAPI`):** O script `electron/preload.js` define expressamente quais operações o Renderer pode solicitar ao processo principal (como salvar ficha, ler índice, abrir janelas de arquivo do Windows e exportar PDF).
- **Navegação externa controlada:** O evento `setWindowOpenHandler` impede que links externos sejam abertos dentro da janela do aplicativo, redirecionando-os para o navegador padrão do sistema através de `shell.openExternal`.

### Operação Totalmente Offline

O aplicativo não realiza chamadas a servidores externos ou CDNs:
- **Fontes locais:** As fontes tipográficas do projeto (`Chakra Petch`, `JetBrains Mono`, `Rajdhani`, `Share Tech Mono` e `Space Grotesk`) estão armazenadas na pasta `fonts/` e carregadas localmente por `css/fonts.css`.
- **Estilos e Scripts locais:** Todos os arquivos de estilo CSS e o bundle JavaScript (`js/bundle.js`) estão empacotados dentro do instalador.
- **Ícones locais:** Ícones em formatos `.ico`, `.png` e `.svg` estão incluídos na pasta `icons/`.

---

## 4. Guia de Desenvolvimento e Compilação

Esta seção é destinada a quem precisa alterar o código-fonte, testar localmente ou compilar novas versões dos executáveis.

### Requisitos do Ambiente

- **Node.js:** Versão 18 ou superior.
- **npm:** Gerenciador de pacotes incluído com o Node.js.
- **Python:** Versão 3.8 ou superior (utilizado pelo script `build_bundle.py` para unificar os módulos JavaScript).
- **Sistema Operacional:** Windows 10 ou 11 (recomendado para gerar os executáveis Windows).

### Scripts Disponíveis no `package.json`

Os comandos abaixo devem ser executados no terminal a partir da raiz do projeto:

#### 1. Instalação das dependências
Executado apenas na primeira vez ou após atualizar dependências no `package.json`:
```powershell
npm.cmd install
```

#### 2. Executar em modo desktop de desenvolvimento
Abre o aplicativo com atalhos de depuração habilitados (é possível abrir as ferramentas de desenvolvedor pressionando `F12` ou `Ctrl + Shift + I`):
```powershell
npm.cmd run dev
```

#### 3. Executar em modo desktop padrão
Inicia a aplicação localmente com o Electron:
```powershell
npm.cmd start
```

#### 4. Reconstruir o bundle JavaScript
Executa o script Python `build_bundle.py`, que lê os arquivos da pasta `js/` e gera o arquivo unificado `js/bundle.js`:
```powershell
npm.cmd run bundle
```

#### 5. Executar os testes do sistema
Executa o conjunto de testes automatizados com Node.js (`tools/test_system.js`), verificando cálculos de regras, integridade do storage e estrutura do bundle:
```powershell
npm.cmd test
```

#### 6. Gerar os executáveis de distribuição

Para compilar os arquivos de instalação e distribuição, utilize um dos comandos a seguir:

- **Gerar apenas o instalador Windows (NSIS):**
  ```powershell
  npm.cmd run build:nsis
  ```

- **Gerar apenas a versão portátil (.exe único):**
  ```powershell
  npm.cmd run build:portable
  ```

- **Gerar a versão descompactada (pasta para testes rápidos):**
  ```powershell
  npm.cmd run build:dir
  ```

- **Compilar todos os formatos (instalador, portátil e descompactado):**
  ```powershell
  npm.cmd run build
  ```

*Observação:* Os comandos de build executam automaticamente o `build_bundle.py` antes de iniciar o `electron-builder`, garantindo que o bundle de scripts sempre esteja atualizado nos executáveis.

---

## 5. Distribuição para Outros Usuários

Para compartilhar o aplicativo com outra pessoa, basta enviar um dos seguintes arquivos da pasta `dist/`:

- **Para usuários que preferem instalar o programa:** Envie o arquivo `Terminal Clandestino de Gerenciamento de Runner Setup 1.0.0.exe`. O instalador cuidará da criação de atalhos e da configuração padrão no Windows.
- **Para uso direto sem instalação:** Envie o arquivo `Terminal Clandestino de Gerenciamento de Runner-Portable-1.0.0.exe`. O usuário pode colocar o executável em qualquer pasta de sua preferência e abri-lo diretamente.

Não é necessário enviar o código-fonte, a pasta `node_modules` ou os scripts adicionais. Os executáveis em `dist/` já contêm todo o runtime, as fontes, os estilos, os arquivos de licença e a lógica necessários para a execução completa.

---

## 6. Autoria, Termos de Licença e Avisos Legais

- **Desenvolvido por:** Pedro Moreira de Souza
- **Aviso de Direitos Autorais:** © 2026 Pedro Moreira de Souza. Direitos reservados aos respectivos titulares.
- **Licença Proprietária de Uso Pessoal:** O código-fonte original, arquitetura e design desenvolvidos por Pedro Moreira de Souza são protegidos pela legislação brasileira aplicável (Lei nº 9.609/1998 e Lei nº 9.610/1998). É permitido o uso do programa para fins pessoais, recreativos e não comerciais (criação e preenchimento de fichas e sessões de RPG com amigos). São vedadas a redistribuição pública não autorizada, sublicenciamento, venda ou exploração comercial dos materiais originais do autor. Para o texto legal completo, consulte o arquivo `LICENSE.md`.
- **Avisos de Terceiros e Marcas Registradas:** *Shadowrun* e *Shadowrun: Anarchy* são marcas registradas e/ou protegidas por direitos autorais pertencentes a The Topps Company, Inc. e Catalyst Game Labs. Este é um projeto amador independente feito por fãs, sem vínculo oficial com os detentores dos direitos. As fontes tipográficas incorporadas são regidas pela SIL Open Font License 1.1 e os componentes de desenvolvimento do Electron pela Licença MIT. Para detalhes e íntegra das licenças de terceiros, consulte `THIRD-PARTY-NOTICES.md`.
