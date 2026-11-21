# As Torres · Personagens mobile

Aplicativo **React Native com Expo**, para Android e iOS. Cópia da experiência de personagens do site, com tema escuro e detalhes roxos. Autores: **Enzo Schiavo e Giovanni Toccoli Bassetti**.

## Funcionalidades

- Cadastro, login e logout; token salvo com Expo SecureStore e tratamento de sessão expirada.
- Lista de personagens próprios, busca por nome, atualização ao puxar e paginação.
- Consulta, criação, edição e exclusão com confirmação.
- Ficha organizada em identidade, recursos e habilidades: classe, patente, história, atributos atuais e máximos, habilidades naturais, principais e perícias.
- Validação de campos obrigatórios e números, estados de carregamento, erros de conexão e aviso antes de descartar alterações.
- Preservação dos vínculos e campos extras ao editar fichas existentes.

O aplicativo depende de conexão com a API. Não inclui campanhas, ameaças, homebrew, rolagens ou edição de inventário.
## Gerar APK instalável

Com JDK 17, Android SDK 36, Build Tools 36.0.0, NDK 27.1.12297006 e CMake 3.22.1 disponíveis, configure `JAVA_HOME` e `ANDROID_HOME` e execute:

```sh
EXPO_PUBLIC_API_URL=http://192.168.0.15:3002/api npm run apk
```

O comando gera `../AsTorres-Mobile.apk` e seu checksum `../AsTorres-Mobile.apk.sha256`. O APK inclui o JavaScript e suporta celulares ARM de 32 e 64 bits; não precisa do Metro nem do Expo Go. Usa a variante release com a assinatura de teste do template Android, destinada à instalação direta para demonstração, não à publicação na loja.

A URL é incorporada ao APK. Para outro servidor, execute novamente o comando com a nova URL. Em builds locais HTTP, o plugin `plugins/with-api-network.cjs` permite esse tráfego somente para o host configurado; os demais hosts continuam exigindo HTTPS.

Para a configuração local `192.168.0.15:3002`, mantenha a API em execução com `npm start` em `TheTowers-Mobile`, deixe a porta 3002 acessível e conecte o celular à mesma rede Wi-Fi. Se o IP do computador mudar, gere o APK novamente. Para acesso fora dessa rede, use uma API pública HTTPS.

A conexão ao Atlas foi verificada por leitura e também pela API HTTP (login, consulta dos três personagens de demonstração e logout), sem alterar fichas.


## Publicação Vercel

O projeto `ttmf` publica a interface web em https://ttmf-two.vercel.app. O aplicativo Android usa a API pública https://ttmobile-three.vercel.app/api. Na web, `/api` é encaminhado à mesma API pelo `vercel.json`. A sessão web fica na aba do navegador; Android e iOS usam SecureStore.

Para gerar o APK conectado à API pública:

```sh
EXPO_PUBLIC_API_URL=https://ttmobile-three.vercel.app/api npm run apk
```

Essa configuração dispensa o servidor local e a conexão à mesma rede Wi-Fi.
