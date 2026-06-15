# Uso responsável

O Mind Clone Studio reproduz a forma de pensar e falar de uma pessoa a partir de
documentos, conversas e entrevistas. Isso é poderoso e exige responsabilidade.

## Uso aceitável

- Clone **a si mesmo**, ou alguém que **deu consentimento explícito**.
- Use para memória pessoal, estudo, criação, assistência e prototipagem.
- Deixe claro, quando relevante, que se trata de um clone digital, não da pessoa real.

## Uso proibido

- Passar-se pela pessoa para enganar terceiros (impersonação, fraude, golpes).
- Difamar, assediar ou criar conteúdo que prejudique a pessoa clonada ou outros.
- Processar dados de alguém sem base legal ou consentimento.

## Responsabilidades

- Quem opera a instância é o **controlador dos dados**. O banco é local/self-hosted;
  os dados que você sobe e os perfis gerados são de sua responsabilidade.
- O perfil destilado concentra informações pessoais (a seção `facts` em especial).
  Trate-o como dado sensível.
- Os textos enviados para gerar embeddings e respostas são processados pela API da
  OpenAI, conforme os termos dela.

## No produto

- A criação de uma persona exige confirmar consentimento (`consent_ack`).
- A destilação do perfil é **grounded**: extrai apenas o que está evidenciado nas
  fontes ou nas respostas da entrevista, e toda proposta passa por revisão humana
  antes de ser aprovada.

Ao usar este projeto você concorda com estas diretrizes. A licença é MIT (ver
[LICENSE](LICENSE)); estas diretrizes descrevem o uso pretendido, não substituem
obrigações legais aplicáveis a você.
