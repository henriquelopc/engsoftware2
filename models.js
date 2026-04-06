const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==========================================
// CLASSES DE DOMÍNIO (Conforme o Diagrama)
// ==========================================

class Produto {
  static async cadastrar(dadosProduto) {
    return await prisma.produto.create({ data: dadosProduto });
  }

  static async consultar(id) {
    return await prisma.produto.findUnique({ where: { id } });
  }

  static async alterar(id, dadosAtualizados) {
    return await prisma.produto.update({
      where: { id },
      data: dadosAtualizados,
    });
  }

  static async deletar(id) {
    return await prisma.produto.delete({ where: { id } });
  }
}

// Herança: Produto Eletrônico
class ProdutoEletronico extends Produto {
  static async cadastrar(nome, preco, estoque, voltagem) {
    return super.cadastrar({
      nome,
      preco,
      estoque,
      tipo: 'ELETRONICO',
      voltagem,
    });
  }
}

// Herança: Produto Perecível
class ProdutoPerecivel extends Produto {
  static async cadastrar(nome, preco, estoque, dataValidade) {
    return super.cadastrar({
      nome,
      preco,
      estoque,
      tipo: 'PERECIVEL',
      dataValidade: new Date(dataValidade), 
    });
  }
}

class Pedido {
  static async cadastrar(valorTotal, itens) {
    return await prisma.pedido.create({
      data: {
        valorTotal,
        itens: {
          create: itens.map(item => ({
            quantidade: item.quantidade,
            valorItem: item.valorItem,
            produtoId: item.produtoId
          }))
        }
      },
      include: { itens: true }
    });
  }

  static async consultar(id) {
    return await prisma.pedido.findUnique({
      where: { id },
      include: { itens: { include: { produto: true } } }
    });
  }
}

module.exports = { Produto, ProdutoEletronico, ProdutoPerecivel, Pedido };