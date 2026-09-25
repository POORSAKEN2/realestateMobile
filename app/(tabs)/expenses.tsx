import { ScrollView, Text, View } from "react-native";
import { useMemo, useState } from "react";

import {
  ExpenseActionSheet,
  ExpenseDashboard,
  EMPTY_EXPENSE_FILTERS,
  ExpenseFilterSheet,
  ExpenseFormModal,
  ExpenseHeader,
  ExpenseGovernanceSheet,
  ExpenseTransactionList,
  type ExpenseFilters,
} from "../../components/expenses";
import { PullToRefreshScrollView } from "../../components/ui/PullToRefreshScrollView";
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
import { useAuth } from "../../hooks/useAuth";
import { useSnackbar } from "../../hooks/useSnackbar";
import type { Expense } from "../../types/domain/expenses";
import { hasAppPermission } from "../../utils/auth/accessPolicy";

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
            <View className="h-44 w-40 rounded-[24px] border border-textPrimary/10 bg-white p-4">
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
  const { session } = useAuth();
  const canApproveExpenses = hasAppPermission(
    session?.user,
    "expenses.approve",
  );
  const isAdmin =
    (session?.user as { role?: string } | undefined)?.role === "ADMIN";
  const expenseSnackbar = useSnackbar();
  const [actionExpense, setActionExpense] = useState<Expense | null>(null);
  const [governanceExpenseId, setGovernanceExpenseId] = useState<string | null>(
    null,
  );
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
          expense.lifecycle_status,
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
        filters.status === "ALL" || expense.lifecycle_status === filters.status;

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

        <PullToRefreshScrollView
          className="mt-5"
          contentContainerStyle={{ paddingBottom: 24 }}
          onRefresh={refetch}
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
                onOpenDetails={
                  isAdmin
                    ? (expense) => setGovernanceExpenseId(expense.id)
                    : undefined
                }
              />
            </>
          )}
        </PullToRefreshScrollView>
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
        onEdit={
          actionExpense &&
          (actionExpense.lifecycle_status === "Pending" || isAdmin)
            ? openEditForm
            : undefined
        }
        onView={
          canApproveExpenses
            ? (expense) => setGovernanceExpenseId(expense.id)
            : undefined
        }
      />

      {isAdmin ? (
        <ExpenseGovernanceSheet
          expenseId={governanceExpenseId}
          onClose={() => setGovernanceExpenseId(null)}
          onEdit={(id) => {
            const expense = expenses.find((item) => item.id === id);
            setGovernanceExpenseId(null);
            if (expense) openEditForm(expense);
          }}
        />
      ) : null}

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
