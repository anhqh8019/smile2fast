import type { SmileTransactionRow } from "../models/smile";

export const mockOcrData: SmileTransactionRow[] = [
  {
    id: "1",

    sel: false,
    pst: true,

    folio: "104774",
    bc: "D",

    voucher: "202608RV26/08-289",

    code: "95",
    description: "Bank Tranfer",

    room: "9900",

    amount: -1130000,
    originAmount: -1130000,
    exchangeRate: 1,
    glAmount: -1130000,

    refNo: "107",
    comment: "18/08/2026 250D608",

    seri: "1C26MYY",
    billNo: "3735",

    cashier: "FO7",
    postTime: "20/08/2026 15:36:27",

    billId: null,
    printTime: null,
    chrPos: null,

    valid: true,
    errors: [],

    matchStatus: "NEW",
  },

  {
    id: "2",

    sel: false,
    pst: true,

    folio: "104944",
    bc: "A",

    voucher: "202608RV26/08-290",

    code: "95",
    description: "Bank Tranfer",

    room: "VA1",

    amount: -30600000,
    originAmount: 0,
    exchangeRate: 1,
    glAmount: -30600000,

    refNo: "106",
    comment: "19/08/2026 250D608",

    seri: null,
    billNo: null,

    cashier: "FO3",
    postTime: "20/08/2026 14:42:30",

    billId: null,
    printTime: null,
    chrPos: null,

    valid: true,
    errors: [],

    matchStatus: "NEW",
  },

  {
    id: "3",

    sel: false,
    pst: true,

    folio: "105005",
    bc: "A",

    voucher: "202608RC26/08-094",

    code: "2 CASH VND",
    description: null,

    room: "302",

    amount: null,
    originAmount: null,
    exchangeRate: 1,
    glAmount: -2,

    refNo: "109",
    comment: null,

    seri: "1C26MYY",
    billNo: "3728",

    cashier: "FO7",
    postTime: "20/08/2026 20:13:59",

    billId: null,
    printTime: null,
    chrPos: null,

    valid: false,

    errors: [
      "Không đọc được Amount",
      "Code không hợp lệ: 2 CASH VND",
    ],

    matchStatus: "INVALID",
  },

  {
    id: "4",

    sel: false,
    pst: true,

    folio: "6000001",
    bc: "A",

    voucher: "202608RV26/08-301",

    code: "95",
    description: "Bank Tranfer",

    room: null,

    amount: -890000,
    originAmount: 0,
    exchangeRate: 1,
    glAmount: -890000,

    refNo: "100002557",
    comment: null,

    seri: "1C26MYY",
    billNo: "3717",

    cashier: "$AM",
    postTime: "20/08/2026 20:49:58",

    billId: null,
    printTime: null,
    chrPos: "FB11",

    valid: true,
    errors: [],

    matchStatus: "NEW",
  },
];