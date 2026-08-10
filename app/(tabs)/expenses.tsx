import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { useState } from "react";

import {
  ExpenseActionSheet,
  ExpenseDashboard,
  ExpenseFormModal,
  ExpenseHeader,
  ExpenseTransactionList,
} from "../../components/expenses";
import { Screen } from "../../components/ui/Screen";
import { ScreenSnackbar } from "../../components/ui/Snackbar";
import { useExpenseForm } from "../../hooks/expenses/useExpenseForm";
import { useSnackbar } from "../../hooks/useSnackbar";
import type { Expense } from "../../types/domain/expenses";

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
    <Screen className="bg-[#FBFBFC]">
      <View className="flex-1">
        <ExpenseHeader onAddExpense={openForm} />

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#634CE4" />
          </View>
        ) : (
          <ScrollView
            className="mt-5"
            contentContainerStyle={{ paddingBottom: 116 }}
            refreshControl={
              <RefreshControl
                colors={["#634CE4"]}
                onRefresh={refetch}
                refreshing={isLoading}
                tintColor="#634CE4"
              />
            }
            showsVerticalScrollIndicator={false}
          >
            <ExpenseDashboard expenses={expenses} />
            <ExpenseTransactionList
              expenses={expenses}
              onOpenActions={setActionExpense}
            />
          </ScrollView>
        )}
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
