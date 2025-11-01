import { useWebCompatibleAlert } from '@/components/WebCompatibleAlert';
import { postInternalTransfer } from '@/services/transactionApi';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Card, Text, TextInput, useTheme } from 'react-native-paper';

export default function InternalTransferScreen() {
  const theme = useTheme();
  const router = useRouter();
  const alert = useWebCompatibleAlert();

  const [toUid, setToUid] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [payPassword, setPayPassword] = useState('');

  const onSubmit = async () => {
    if (!toUid || !amount || !payPassword) return;
    setLoading(true);
    try {
      const resp = await postInternalTransfer({
        toUserName: toUid,
        amount: Number(amount),
        remark: note || '站內轉帳',
        payPassword: payPassword,
      });
      if (resp && (resp.code === 200 || resp.success)) {
        alert('成功', '轉帳提交成功');
        router.back();
      } else {
        const msg = resp?.message || '轉帳失敗，請稍後再試';
        alert('錯誤', msg);
      }
    } catch (e: any) {
      const msg = e?.message || '轉帳失敗，請稍後再試';
      alert('錯誤', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '站內轉帳',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: { fontWeight: '600' },
          headerTitleAlign: 'center',
        }}
      />
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}> 
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12, color: theme.colors.onSurface }}>
              請輸入轉帳信息
            </Text>
            <TextInput
              mode="outlined"
              value={toUid}
              onChangeText={setToUid}
              placeholder="收款人帳號"
              left={<TextInput.Icon icon="account" />}
              style={styles.input}
              keyboardType="default"
            />
            <TextInput
              mode="outlined"
              value={amount}
              onChangeText={setAmount}
              placeholder="轉帳金額"
              left={<TextInput.Icon icon="currency-usd" />}
              right={<TextInput.Affix text="USDT" />}
              style={styles.input}
              keyboardType="numeric"
            />
            <TextInput
              mode="outlined"
              value={payPassword}
              onChangeText={setPayPassword}
              placeholder="支付密碼"
              left={<TextInput.Icon icon="lock" />}
              secureTextEntry
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              value={note}
              onChangeText={setNote}
              placeholder="備註（可選）"
              left={<TextInput.Icon icon="note-text" />}
              style={styles.input}
            />
            <Button mode="contained" onPress={onSubmit} loading={loading} disabled={loading || !toUid || !amount || !payPassword}>
              確認轉帳
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
  },
  card: {
    borderRadius: 12,
  },
  input: {
    marginBottom: 12,
  },
});


