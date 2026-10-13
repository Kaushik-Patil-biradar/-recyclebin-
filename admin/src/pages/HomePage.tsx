import React, { useState, useEffect } from 'react';
import {
  Main,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Typography,
  Button,
  Flex,
  Searchbar,
  Box,
} from '@strapi/design-system';
import { ArrowClockwise, Trash } from '@strapi/icons';
import { useFetchClient, useNotification, Layouts } from '@strapi/strapi/admin';

interface RecycleItem {
  id: number;
  entityUid: string;
  title: string;
  recordDocumentId: string;
  deletedAt: string;
  deletedBy?: { firstname?: string; lastname?: string; email?: string };
}

const HomePage = () => {
  const [items, setItems] = useState<RecycleItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const { get, post, del } = useFetchClient();
  const { toggleNotification } = useNotification();

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await get<{ data?: RecycleItem[] }>(
        `/recycle-bin/items?search=${encodeURIComponent(search)}`
      );
      setItems(data?.data || []);
    } catch (err: any) {
      toggleNotification({
        type: 'danger',
        message: err?.message || 'Failed to fetch recycle bin items',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [search]);

  const handleRestore = async (id: number) => {
    try {
      await post(`/recycle-bin/items/${id}/restore`, {});
      toggleNotification({
        type: 'success',
        message: 'Item restored successfully',
      });
      fetchItems();
    } catch (err: any) {
      toggleNotification({
        type: 'danger',
        message: err?.response?.data?.error?.message || err?.message || 'Failed to restore item',
      });
    }
  };

  const handlePurge = async (id: number) => {
    if (window.confirm('This will permanently delete the snapshot. Continue?')) {
      try {
        await del(`/recycle-bin/items/${id}`);
        toggleNotification({
          type: 'success',
          message: 'Item permanently deleted',
        });
        fetchItems();
      } catch (err: any) {
        toggleNotification({
          type: 'danger',
          message: err?.response?.data?.error?.message || err?.message || 'Failed to purge item',
        });
      }
    }
  };

  return (
    <Main>
      <Layouts.Header
        title="Recycle Bin"
        subtitle="Recover deleted content items before permanent purge"
      />
      <Layouts.Content>
        <Flex direction="column" alignItems="stretch" gap={4}>
          <Searchbar
            name="search"
            placeholder="Search by title..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            clearLabel="Clear search"
          >
            Search by title
          </Searchbar>
          <Table colCount={5} rowCount={items.length}>
            <Thead>
              <Tr>
                <Th><Typography variant="sigma">Title</Typography></Th>
                <Th><Typography variant="sigma">Content Type</Typography></Th>
                <Th><Typography variant="sigma">Deleted At</Typography></Th>
                <Th><Typography variant="sigma">Deleted By</Typography></Th>
                <Th><Typography variant="sigma">Actions</Typography></Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.length === 0 ? (
                <Tr>
                  <Td colSpan={5}>
                    <Box padding={6} textAlign="center">
                      <Typography variant="delta" textColor="neutral600">
                        {loading ? 'Loading items...' : 'No items found in the recycle bin'}
                      </Typography>
                    </Box>
                  </Td>
                </Tr>
              ) : (
                items.map((row) => (
                  <Tr key={row.id}>
                    <Td><Typography>{row.title || row.recordDocumentId}</Typography></Td>
                    <Td><Typography>{row.entityUid}</Typography></Td>
                    <Td><Typography>{new Date(row.deletedAt).toLocaleString()}</Typography></Td>
                    <Td><Typography>{row.deletedBy?.email || 'System / API'}</Typography></Td>
                    <Td>
                      <Flex gap={2}>
                        <Button
                          size="S"
                          variant="tertiary"
                          startIcon={<ArrowClockwise />}
                          onClick={() => handleRestore(row.id)}
                        >
                          Restore
                        </Button>
                        <Button
                          size="S"
                          variant="danger-light"
                          startIcon={<Trash />}
                          onClick={() => handlePurge(row.id)}
                        >
                          Purge
                        </Button>
                      </Flex>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Flex>
      </Layouts.Content>
    </Main>
  );
};

export { HomePage };