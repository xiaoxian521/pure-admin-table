import "./index.css";
import props from "./props";
import Renderer from "../renderer";
import { isFunction } from "../helper";
import {
  ref,
  unref,
  toRefs,
  computed,
  defineComponent,
  type CSSProperties
} from "vue";
import { PureTableProps, TableColumnScope } from "../../types";
import { ElTable, ElTableColumn, ElPagination } from "element-plus";

const TableRef = ref();

export default defineComponent({
  name: "PureTable",
  props,
  methods: {
    /** Get Table Methods */
    getTableRef() {
      return TableRef.value;
    }
  },
  emits: ["size-change", "current-change"],
  setup(props, { slots, attrs, emit }) {
    const { columns, align, headerAlign, showOverflowTooltip, pagination } =
      toRefs(props) as unknown as PureTableProps;

    const handleSizeChange = val => {
      unref(pagination).pageSize = val;
      emit("size-change", val);
    };

    const handleCurrentChange = val => {
      unref(pagination).currentPage = val;
      emit("current-change", val);
    };

    const getStyle = computed((): CSSProperties => {
      return Object.assign(
        {
          width: "100%",
          margin: "16px 0",
          display: "flex",
          justifyContent:
            unref(pagination).align === "left"
              ? "flex-start"
              : unref(pagination).align === "center"
              ? "center"
              : "flex-end"
        },
        unref(pagination).style ?? {}
      );
    });

    let conditions =
      unref(pagination) &&
      unref(pagination).currentPage &&
      unref(pagination).pageSize;

    return () => (
      <>
        <ElTable {...props} {...attrs} ref={TableRef}>
          {{
            default: () => {
              return unref(columns).map((column, index) => {
                const defaultSlots = {
                  default: (scope: TableColumnScope) => {
                    if (column?.cellRenderer) {
                      return (
                        <Renderer
                          render={column.cellRenderer}
                          params={Object.assign(scope, {
                            index: scope.$index,
                            props,
                            attrs
                          })}
                        ></Renderer>
                      );
                    } else if (column?.slot) {
                      return slots?.[column.slot]?.(
                        Object.assign(scope, {
                          index: scope.$index,
                          props,
                          attrs
                        })
                      );
                    }
                  }
                };
                const scopedSlots = column?.headerRenderer
                  ? {
                      header: (scope: TableColumnScope) => {
                        return (
                          <Renderer
                            render={column.headerRenderer}
                            params={Object.assign(scope, {
                              index: scope.$index,
                              props,
                              attrs
                            })}
                          ></Renderer>
                        );
                      },
                      ...defaultSlots
                    }
                  : defaultSlots;
                if (isFunction(column?.hide) && column?.hide(attrs)) {
                  return column?.hide(attrs);
                }
                return (
                  <ElTableColumn
                    {...column}
                    key={index}
                    align={column.align ? column.align : unref(align)}
                    headerAlign={
                      column.headerAlign
                        ? column.headerAlign
                        : unref(headerAlign)
                    }
                    showOverflowTooltip={
                      Object.keys(column).includes("showOverflowTooltip")
                        ? column.showOverflowTooltip
                        : unref(showOverflowTooltip)
                    }
                  >
                    {scopedSlots}
                  </ElTableColumn>
                );
              });
            },
            append: () => {
              return slots.append && slots.append();
            },
            empty: () => {
              return slots.empty && slots.empty();
            }
          }}
        </ElTable>
        {conditions ? (
          <ElPagination
            {...attrs}
            class="pure-pagination"
            style={unref(getStyle)}
            {...unref(pagination)}
            small={
              props?.paginationSmall
                ? props?.paginationSmall
                : unref(pagination).small
                ? unref(pagination).small
                : false
            }
            layout={
              unref(pagination).layout ??
              "total, sizes, prev, pager, next, jumper"
            }
            pageSizes={unref(pagination).pageSizes ?? [5, 10, 15, 20]}
            onSizeChange={val => handleSizeChange(val)}
            onCurrentChange={val => handleCurrentChange(val)}
          ></ElPagination>
        ) : null}
      </>
    );
  }
});
