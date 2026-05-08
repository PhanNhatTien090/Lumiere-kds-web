export type DishStatus = 'START' | 'COOKING' | 'DONE' | 'RUSH';
export type TableStatus = 'NEW' | 'COOKING' | 'WAITING' | 'COMPLETED';

export interface OrderItem {
  id: string;
  quantity: number;
  name: string;
  note?: string;
  status: DishStatus;
}

export interface TableOrder {
  id: string;
  tableName: string;
  status: TableStatus;
  statusText: string;
  timer: string;
  isUrgent?: boolean;
  items: OrderItem[];
}

export const liveOrders: TableOrder[] = [
  {
    id: 't7',
    tableName: 'Bàn 7',
    status: 'NEW',
    statusText: 'MỚI',
    timer: '00:04:22',
    isUrgent: true,
    items: [
      { id: 'i1', quantity: 2, name: 'Grilled Sea Bass', note: 'Ít bơ, không caper', status: 'START' },
      { id: 'i2', quantity: 1, name: 'Lychee Martini', status: 'DONE' },
    ]
  },
  {
    id: 't5',
    tableName: 'Bàn 5',
    status: 'COOKING',
    statusText: 'ĐANG NẤU',
    timer: '00:12:08',
    items: [
      { id: 'i3', quantity: 3, name: 'Wagyu Striploin', status: 'COOKING' },
      { id: 'i4', quantity: 1, name: 'Duck Confit', status: 'COOKING' },
      { id: 'i5', quantity: 2, name: 'Tuna Tartare', status: 'DONE' },
    ]
  },
  {
    id: 't2',
    tableName: 'Bàn 2',
    status: 'COOKING',
    statusText: 'ĐANG NẤU',
    timer: '00:08:44',
    items: [
      { id: 'i6', quantity: 1, name: 'Grilled Sea Bass', status: 'COOKING' },
      { id: 'i7', quantity: 2, name: 'Chocolate Lava', status: 'DONE' },
    ]
  },
  {
    id: 't11',
    tableName: 'Bàn 11',
    status: 'WAITING',
    statusText: 'CHỜ NẤU',
    timer: '00:01:12',
    items: [
      { id: 'i8', quantity: 2, name: 'Burrata Salad', status: 'START' },
      { id: 'i9', quantity: 1, name: 'Duck Confit', status: 'START' },
    ]
  },
  {
    id: 't1',
    tableName: 'Bàn 1',
    status: 'NEW',
    statusText: 'MỚI VÀO',
    timer: '00:00:38',
    items: [
      { id: 'i10', quantity: 2, name: 'Wagyu Striploin', status: 'RUSH' },
      { id: 'i11', quantity: 1, name: 'Tuna Tartare', status: 'START' },
      { id: 'i12', quantity: 2, name: 'Chocolate Lava', status: 'START' },
    ]
  },
  {
    id: 't10',
    tableName: 'Bàn 10',
    status: 'NEW',
    statusText: 'MỚI',
    timer: '00:00:12',
    items: [
      { id: 'i13', quantity: 3, name: 'Grilled Sea Bass', status: 'START' },
      { id: 'i14', quantity: 2, name: 'Crème Brûlée', status: 'START' },
      { id: 'i15', quantity: 2, name: 'Lychee Martini', status: 'DONE' },
    ]
  }
];

export interface BatchItemDetail {
  tableCode: string;
  quantity: number;
  note: string;
  warning?: boolean;
}

export interface BatchOrder {
  id: string;
  titleQuantity: number;
  dishName: string;
  orderCount: number;
  tableCount: number;
  instruction: string;
  details: BatchItemDetail[];
  savedTime: string;
  tablesSummary: string;
}

export const batchOrders: BatchOrder[] = [
  {
    id: 'b1',
    titleQuantity: 6,
    dishName: 'Grilled Sea Bass',
    orderCount: 3,
    tableCount: 3,
    instruction: 'Nấu cùng lúc — thời gian chiên như nhau',
    details: [
      { tableCode: 'T07', quantity: 2, note: 'Ít bơ, không caper', warning: true },
      { tableCode: 'T02', quantity: 1, note: 'Tiêu chuẩn' },
      { tableCode: 'T10', quantity: 3, note: 'Tiêu chuẩn' },
    ],
    savedTime: '~8 phút',
    tablesSummary: 'Bàn 2, 7, 10'
  },
  {
    id: 'b2',
    titleQuantity: 5,
    dishName: 'Wagyu Striploin',
    orderCount: 2,
    tableCount: 2,
    instruction: 'Bếp nướng — cần lệch 2 phút theo độ chín',
    details: [
      { tableCode: 'T05', quantity: 3, note: 'Medium rare' },
      { tableCode: 'T01', quantity: 2, note: 'Medium' },
    ],
    savedTime: '~12 phút',
    tablesSummary: 'Bàn 1, 5'
  },
  {
    id: 'b3',
    titleQuantity: 2,
    dishName: 'Duck Confit',
    orderCount: 2,
    tableCount: 2,
    instruction: 'Bếp lò — cùng nhiệt độ 180°C',
    details: [
      { tableCode: 'T05', quantity: 1, note: 'Tiêu chuẩn' },
      { tableCode: 'T11', quantity: 1, note: 'Tiêu chuẩn' },
    ],
    savedTime: '~15 phút',
    tablesSummary: 'Bàn 5, 11'
  },
  {
    id: 'b4',
    titleQuantity: 4,
    dishName: 'Chocolate Lava',
    orderCount: 2,
    tableCount: 2,
    instruction: 'Lò nướng — batch vào cùng lúc, 12 phút',
    details: [
      { tableCode: 'T01', quantity: 2, note: 'Tiêu chuẩn' },
      { tableCode: 'T02', quantity: 2, note: 'Tiêu chuẩn' },
    ],
    savedTime: '~10 phút',
    tablesSummary: 'Bàn 1, 2'
  }
];

export interface CompletedOrder {
  id: string;
  tableName: string;
  summary: string;
  servedTime: string;
  duration: string;
}

export const completedOrders: CompletedOrder[] = [
  {
    id: 'c1',
    tableName: 'Bàn 4',
    summary: 'Duck Confit × 2, Crème Brûlée × 1',
    servedTime: '20:01',
    duration: '00:18:32'
  },
  {
    id: 'c2',
    tableName: 'Bàn 8',
    summary: 'Wagyu Striploin × 2, Lychee Martini × 2',
    servedTime: '19:58',
    duration: '00:22:14'
  },
  {
    id: 'c3',
    tableName: 'Bàn 3',
    summary: 'Burrata Salad × 2, Chocolate Lava × 1',
    servedTime: '19:44',
    duration: '00:35:08'
  }
];
