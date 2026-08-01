# language: pt

Funcionalidade: Gestão de categorias no admin
  Como administrador
  Quero gerenciar categorias
  Para organizar os mercados

  @admin @regression @creates-category
  Cenário: Admin cria categoria
    Dado que estou logado como "admin"
    E existe uma categoria de teste criada via API
    Quando navego para "/admin/categories"
    Então devo ver a categoria de teste

  @admin @regression @creates-category
  Cenário: Admin edita categoria
    Dado que estou logado como "admin"
    E existe uma categoria de teste criada via API
    Quando edito a categoria de teste para "E2E Editada"
    Então a categoria de teste deve existir na API

  @admin @regression @creates-category
  Cenário: Admin exclui categoria vazia
    Dado que estou logado como "admin"
    E existe uma categoria de teste criada via API
    Quando excluo a categoria de teste via API
    Então a categoria de teste não deve existir na API

  @admin @regression
  Cenário: Admin não exclui categoria com apostas
    Dado que estou logado como "admin"
    Quando navego para "/admin/categories"
    E tento excluir a categoria "Futebol"
    Então devo ver erro ao excluir categoria com apostas
