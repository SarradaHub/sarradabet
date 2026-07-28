# language: pt

@ticket
Funcionalidade: Geração de imagens de ticket para resgate e validação
  Como usuário e administrador
  Eu quero gerar e baixar imagens de ticket com QR Code
  Para ter um comprovante visual do resgate e da validação

  @smoke @ticket @public
  Cenário: Qualquer pessoa pode abrir a página pública de verificação
    Quando navego para "/tickets/verify/00000000-0000-4000-8000-000000000099"
    Então devo ver o título "Verificação de ticket"

  @smoke @ticket @public
  Cenário: Ticket inexistente exibe mensagem na verificação pública
    Quando navego para "/tickets/verify/00000000-0000-4000-8000-000000000099"
    Então devo ver o texto "Ticket não encontrado"

  @smoke @ticket @rewards
  Cenário: Usuário autenticado vê opção de resgate no catálogo
    Dado que estou logado como "user"
    Quando navego para "/rewards"
    Então devo ver o título "Recompensas"

  @smoke @ticket @admin
  Cenário: Admin acessa validação de tickets
    Dado que estou logado como "admin"
    Quando navego para "/admin/rewards"
    Então devo ver o texto "Validar ticket"
