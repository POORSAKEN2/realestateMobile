import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useMemo, useState } from "react";

import {
  ExpenseActionSheet,
  ExpenseDashboard,
  EMPTY_EXPENSE_FILTERS,
  ExpenseFilterSheet,
  ExpenseFormModal,
  ExpenseHeader,
  ExpenseTransactionList,
  type ExpenseFilters,
} from "../../components/expenses";
import { Screen } from "../../components/ui/Screen";
import {
  formatSearchResultLabel,
  SearchToolbar,
} from "../../components/ui/SearchToolbar";
import {
  SkeletonBlock,
  SkeletonGroup,
  SkeletonList,
  SkeletonListCard,
} from "../../components/ui/Skeleton";
import { ScreenSnackbar } from "../../components/ui/Snackbar";
import { useExpenseForm } from "../../hooks/expenses/useExpenseForm";
import { useSnackbar } from "../../hooks/useSnackbar";
import type { Expense } from "../../types/domain/expenses";

function ExpenseLoadingState() {
  return (
    <SkeletonGroup accessibilityLabel="Loading expense dashboard">
      <View className="flex-row items-center justify-between">
        <SkeletonBlock className="h-4 w-36" />
        <SkeletonBlock className="h-3 w-20" />
      </View>
      <ScrollView
        className="-mx-1 mt-3"
        contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}
        horizontal
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
      >
        <SkeletonList
          count={3}
          renderItem={() => (
            <View className="h-44 w-40 rounded-[24px] border border-slate-200 bg-white p-4">
              <View className="flex-row items-center justify-between">
                <SkeletonBlock className="h-10 w-10 rounded-2xl" />
                <SkeletonBlock className="h-4 w-12" />
              </View>
              <SkeletonBlock className="mt-5 h-6 w-28" />
              <SkeletonBlock className="mt-2 h-3 w-20" />
              <SkeletonBlock className="mt-auto h-10 w-full rounded-xl" />
            </View>
          )}
        />
      </ScrollView>

      <Text className="mt-5 font-ralewayBold text-[13px] uppercase text-textPrimary">
        Recent Transactions &amp; Approvals
      </Text>
      <View className="mt-3 gap-3">
        <SkeletonList
          count={3}
          renderItem={() => <SkeletonListCard className="min-h-[84px]" />}
        />
      </View>
    </SkeletonGroup>
  );
}

export default function ExpensesScreen() {
  const expenseSnackbar = useSnackbar();
  const [actionExpense, setActionExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<ExpenseFilters>(EMPTY_EXPENSE_FILTERS);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const {
    closeForm,
    editingExpense,
    expenses,
    form,
    formError,
    handleDateConfirm,
    isDatePickerVisible,
    isFormVisible,
    isLoading,
    isRefreshing,
    isSaving,
    openEditForm,
    openForm,
    propertyOptions,
    refetch,
    setIsDatePickerVisible,
    submit,
    updateForm,
  } = useExpenseForm({
    onSaved: (operation) =>
      expenseSnackbar.show(
        operation === "created" ? "Expense recorded." : "Expense updated.",
      ),
  });
  const filteredExpenses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return expenses.filter((expense) => {
      const matchesSearch =
        !query ||
        [
          expense.category,
          expense.description,
          expense.reference_no,
          expense.status,
          expense.property?.title,
          expense.property?.location,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesProperty =
        filters.propertyId === "ALL" ||
        expense.property_id === filters.propertyId;
      const matchesCategory =
        filters.category === "ALL" || expense.category === filters.category;
      const matchesStatus =
        filters.status === "ALL" || expense.status === filters.status;

      return (
        matchesSearch && matchesProperty && matchesCategory && matchesStatus
      );
    });
  }, [expenses, filters, searchQuery]);
  const expenseCategories = useMemo(
    () =>
      Array.from(new Set(expenses.map((expense) => expense.category))).sort(),
    [expenses],
  );
  const activeFilterCount = [
    filters.propertyId !== "ALL",
    filters.category !== "ALL",
    filters.status !== "ALL",
  ].filter(Boolean).length;

  return (
    <Screen bottomInset="tab-bar" className="bg-surface">
      <View className="flex-1">
        <ExpenseHeader onAddExpense={openForm} />

        <ScrollView
          className="mt-5"
          contentContainerStyle={{ paddingBottom: 116 }}
          refreshControl={
            <RefreshControl
              colors={["#8A77F4"]}
              onRefresh={refetch}
              refreshing={isRefreshing}
              tintColor="#8A77F4"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <ExpenseLoadingState />
          ) : (
            <>
              <ExpenseDashboard expenses={expenses} />
              <SearchToolbar
                accessibilityLabel="Search expenses"
                activeFilterCount={activeFilterCount}
                className="mt-4"
                clearAccessibilityLabel="Clear expense search"
                filterAccessibilityLabel={
                  activeFilterCount
                    ? `Filter expenses, ${activeFilterCount} active`
                    : "Filter expenses"
                }
                filterLabel={
                  activeFilterCount
                    ? `${activeFilterCount} active filters`
                    : "All expenses"
                }
                onChangeText={setSearchQuery}
                onFilterPress={() => setIsFilterVisible(true)}
                placeholder="Category, property, reference, or status"
                resultLabel={formatSearchResultLabel({
                  filteredCount: filteredExpenses.length,
                  singular: "expense",
                  totalCount: expenses.length,
                })}
                value={searchQuery}
              />
              <ExpenseTransactionList
                expenses={filteredExpenses}
                isFiltered={Boolean(searchQuery.trim() || activeFilterCount)}
                onOpenActions={setActionExpense}
              />
            </>
          )}
        </ScrollView>
      </View>

      <ExpenseFilterSheet
        categories={expenseCategories}
        filters={filters}
        onApply={(nextFilters) => {
          setFilters(nextFilters);
          setIsFilterVisible(false);
        }}
        onClose={() => setIsFilterVisible(false)}
        properties={propertyOptions}
        visible={isFilterVisible}
      />

      <ExpenseActionSheet
        expense={actionExpense}
        onClose={() => setActionExpense(null)}
        onEdit={openEditForm}
      />

      <ExpenseFormModal
        editingExpense={editingExpense}
        form={form}
        formError={formError}
        isDatePickerVisible={isDatePickerVisible}
        isSaving={isSaving}
        isVisible={isFormVisible}
        onClose={closeForm}
        onDateConfirm={handleDateConfirm}
        onSetDatePickerVisible={setIsDatePickerVisible}
        onSubmit={submit}
        onUpdateForm={updateForm}
        propertyOptions={propertyOptions}
      />

      <ScreenSnackbar
        message={expenseSnackbar.message}
        onDismiss={expenseSnackbar.dismiss}
      />
    </Screen>
  );
}
