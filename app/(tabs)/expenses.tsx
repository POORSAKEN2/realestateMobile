import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";

import {
  ExpenseDashboard,
  ExpenseFormModal,
  ExpenseHeader,
  ExpenseTransactionList,
} from "../../components/expenses";
import { Screen } from "../../components/ui/Screen";
import { useExpenseForm } from "../../hooks/expenses/useExpenseForm";

export default function ExpensesScreen() {
  const {
    closeForm,
    editingExpense,
    expenses,
    form,
    formError,
    handleDateChange,
    isDatePickerVisible,
    isFormVisible,
    isLoading,
    isSaving,
    openForm,
    propertyOptions,
    refetch,
    setIsDatePickerVisible,
    submit,
    updateForm,
  } = useExpenseForm();

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
            <ExpenseDashboard />
            <ExpenseTransactionList expenses={expenses} />
          </ScrollView>
        )}
      </View>

      <ExpenseFormModal
        editingExpense={editingExpense}
        form={form}
        formError={formError}
        isDatePickerVisible={isDatePickerVisible}
        isSaving={isSaving}
        isVisible={isFormVisible}
        onClose={closeForm}
        onDateChange={handleDateChange}
        onSetDatePickerVisible={setIsDatePickerVisible}
        onSubmit={submit}
        onUpdateForm={updateForm}
        propertyOptions={propertyOptions}
      />
    </Screen>
  );
}
