# language: pt

Funcionalidade: Perfil do usuário
  Como usuário autenticado
  Quero visualizar meu perfil
  Para conferir meus dados

  @smoke @regression
  Cenário: Usuário visualiza dados do perfil
    Dado que estou logado como "user"
    Quando navego para "/profile"
    Então devo ver meu perfil com o usuário "user"
