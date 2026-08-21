# language: pt

Funcionalidade: Compra de moedas via Pix
  Como usuário autenticado
  Quero comprar moedas com Pix
  Para usar na plataforma

  @pix @regression
  Cenário: Compra com Pix estático exibe comprovante e chave
    Dado que estou logado como "user"
    Quando navego para "/coins"
    E aceito o aviso financeiro
    E compro o primeiro pacote com Pix
    Então devo ver o pagamento Pix pendente
    E devo ver a mensagem de comprovante Pix
    E devo ver a chave Pix estática

  @regression
  Cenário: Usuário visualiza saldo e histórico
    Dado que estou logado como "user"
    Quando navego para "/coins"
    Então devo ver meu saldo de moedas
    E devo ver o histórico de transações
