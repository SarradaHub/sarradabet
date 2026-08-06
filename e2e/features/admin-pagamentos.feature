# language: pt

Funcionalidade: Pagamentos admin — caixa QR presencial
  Como administrador
  Quero gerar QR presencial para clientes
  Para registrar pagamentos no caixa

  @admin @smoke @regression
  Cenário: Admin gera QR presencial e simula pagamento
    Dado que estou logado como "admin"
    Quando navego para "/admin/payments"
    E gero QR presencial para o usuário "user" com pacote "Pacote Básico"
    Então devo ver o pagamento QR presencial no caixa
    Quando simulo pagamento aprovado no caixa
    Então devo ver o texto "Pagamento simulado e moedas creditadas."

  @admin @regression
  Cenário: Admin visualiza monitoramento de pagamentos
    Dado que estou logado como "admin"
    Quando navego para "/admin/payments"
    E abro o monitoramento de pagamentos
    Então devo ver a tabela de pagamentos
