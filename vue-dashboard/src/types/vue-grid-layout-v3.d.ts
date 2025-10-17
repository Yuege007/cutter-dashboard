declare module 'vue-grid-layout-v3' {
  import { DefineComponent } from 'vue'

  export interface LayoutItem {
    i: string
    x: number
    y: number
    w: number
    h: number
    minW?: number
    minH?: number
    maxW?: number
    maxH?: number
    minX?: number
    maxX?: number
    minY?: number
    maxY?: number
    static?: boolean
    isDraggable?: boolean
    isResizable?: boolean
    preserveAspectRatio?: boolean
  }

  export interface GridLayoutProps {
    layout: LayoutItem[]
    colNum?: number
    rowHeight?: number
    maxRows?: number
    margin?: [number, number]
    isDraggable?: boolean
    isResizable?: boolean
    isMirrored?: boolean
    isBounded?: boolean
    useCssTransforms?: boolean
    verticalCompact?: boolean
    restoreOnDrag?: boolean
    preventCollision?: boolean
    responsive?: boolean
    responsiveLayouts?: Record<string, LayoutItem[]>
    breakpoints?: Record<string, number>
    cols?: Record<string, number>
    transformScale?: number
  }

  export interface GridItemProps {
    i: string
    x: number
    y: number
    w: number
    h: number
    minW?: number
    minH?: number
    maxW?: number
    maxH?: number
    minX?: number
    maxX?: number
    minY?: number
    maxY?: number
    static?: boolean
    isDraggable?: boolean
    isResizable?: boolean
    preserveAspectRatio?: boolean
    dragIgnoreFrom?: string
    dragAllowFrom?: string
    resizeIgnoreFrom?: string
  }

  export interface GridLayoutEvents {
    'layout-created': (layout: LayoutItem[]) => void
    'layout-before-mount': (layout: LayoutItem[]) => void
    'layout-mounted': (layout: LayoutItem[]) => void
    'layout-ready': (layout: LayoutItem[]) => void
    'layout-updated': (layout: LayoutItem[]) => void
    'breakpoint-changed': (newBreakpoint: string, layout: LayoutItem[]) => void
    'container-resized': (i: string, h: number, w: number, hPx: number, wPx: number) => void
  }

  export interface GridItemEvents {
    move: (i: string, x: number, y: number) => void
    moved: (i: string, x: number, y: number) => void
    resize: (i: string, h: number, w: number, hPx: number, wPx: number) => void
    resized: (i: string, h: number, w: number, hPx: number, wPx: number) => void
    'container-resized': (i: string, h: number, w: number, hPx: number, wPx: number) => void
  }

  export const GridLayout: DefineComponent<
    GridLayoutProps,
    {},
    {},
    {},
    {},
    {},
    {},
    GridLayoutEvents
  >

  export const GridItem: DefineComponent<
    GridItemProps,
    {},
    {},
    {},
    {},
    {},
    {},
    GridItemEvents
  >

  const VueGridLayout: {
    GridLayout: typeof GridLayout
    GridItem: typeof GridItem
    install: (app: any) => void
  }

  export default VueGridLayout
}
