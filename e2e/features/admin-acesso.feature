# language: pt

Funcionalidade: Acesso administrativo
  Como administrador
  Quero acessar o painel admin
  Para gerenciar a plataforma

  @smoke @admin
  Cenário: Usuário comum não acessa admin
    Dado que estou na página de login admin
    Quando preencho "Usuário ou Email" com "user"
    E preencho "Senha" com "user123"
    E clico em "Entrar"
    Então devo ver o texto "Acesso restrito a administradores"

  @smoke @admin
  Cenário: Admin faz login no painel
    Dado que estou logado como "admin"
    Então devo ver a URL contendo "/admin/dashboard"
    E devo ver o link "Apostas"
    E devo ver o link "Categorias"
