# language: pt

Funcionalidade: Gestão de usuários no admin
  Como administrador
  Quero listar e excluir usuários
  Para gerenciar contas da plataforma

  @smoke @admin @regression
  Cenário: Admin lista usuários do seed
    Dado que estou logado como "admin"
    Quando navego para "/admin/users"
    Então devo ver o usuário "user" na listagem
    E devo ver o usuário "admin" na listagem
    E devo ver o usuário "maria" na listagem

  @admin @regression @creates-user
  Cenário: Admin exclui usuário registrado via API
    Dado que estou logado como "admin"
    E existe um usuário de teste criado via API
    Quando navego para "/admin/users"
    E excluo o usuário de teste
    Então o usuário de teste não deve aparecer na listagem

  @admin @regression
  Cenário: Admin não pode excluir a própria conta
    Dado que estou logado como "admin"
    Quando navego para "/admin/users"
    Então o botão "Excluir" do usuário "admin" deve estar desabilitado
