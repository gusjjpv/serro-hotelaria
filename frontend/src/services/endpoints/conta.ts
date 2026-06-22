import { hotelApi } from '@/services/api'
import type { Conta, Despesa, DespesaCreateRequest, Produto } from '@/types/conta'

export async function addDespesa(data: DespesaCreateRequest) {
  return hotelApi.post('despesas/', { json: data }).json<Despesa>()
}

export async function getExtrato(contaId: number) {
  return hotelApi.get(`contas/${contaId}/extrato/`).json<{ conta: Conta; despesas: Despesa[] }>()
}

export async function listProdutos() {
  return hotelApi.get('produtos/').json<Produto[]>()
}

export async function createProduto(data: Partial<Produto>) {
  return hotelApi.post('produtos/', { json: data }).json<Produto>()
}
