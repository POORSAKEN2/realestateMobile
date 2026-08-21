import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useState } from "react";

import {
  ExpenseActionSheet,
  ExpenseDashboard,
  ExpenseFormModal,
  ExpenseHeader,
  ExpenseTransactionList,
} from "../../components/expenses";
import { Screen } from "../../components/ui/Screen";
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

  return (
    <Screen bottomInset="tab-bar" className="bg-surface">
      <View className="flex-1">
        <ExpenseHeader onAddExpense={openForm} />

        <ScrollView
          className="mt-5"
          contentContainerStyle={{ paddingBottom: 116 }}
          refreshControl={
            <RefreshControl
              colors={["#634CE4"]}
              onRefresh={refetch}
              refreshing={isRefreshing}
              tintColor="#634CE4"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <ExpenseLoadingState />
          ) : (
            <>
              <ExpenseDashboard expenses={expenses} />
              <ExpenseTransactionList
                expenses={expenses}
                onOpenActions={setActionExpense}
              />
            </>
          )}
        </ScrollView>
      </View>

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
